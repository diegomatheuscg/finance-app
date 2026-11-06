import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/contexts/wallet-context'
import { useAuth } from '@/hooks/use-auth'
import { walletApi } from '@/lib/api'

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        aria-labelledby="wallet-modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-card p-6 shadow-lg"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold" id="wallet-modal-title">{title}</h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Fechar</Button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MemberFields({ memberEmail, memberRole, onEmailChange, onRoleChange, onAdd }) {
  return (
    <div className="grid gap-3 border-t pt-4">
      <h3 className="text-sm font-medium">Adicionar membro</h3>
      <input
        className="h-10 rounded-md border bg-background px-3 text-sm"
        type="email"
        placeholder="E-mail"
        value={memberEmail}
        onChange={(event) => onEmailChange(event.target.value)}
      />
      <select
        className="h-10 rounded-md border bg-background px-3 text-sm"
        value={memberRole}
        onChange={(event) => onRoleChange(event.target.value)}
      >
        <option value="VIEWER">VIEWER</option>
        <option value="EDITOR">EDITOR</option>
      </select>
      <Button type="button" variant="outline" onClick={onAdd}>Adicionar à lista</Button>
    </div>
  )
}

export function WalletsPage() {
  const { user } = useAuth()
  const {
    error: loadError,
    reloadWallets,
    status,
    wallets,
  } = useWallet()
  const [modal, setModal] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState([])
  const [membersError, setMembersError] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('VIEWER')

  const selectedWallet = wallets.find((wallet) => String(wallet.id) === String(modal?.walletId))
  const isOwner = selectedWallet?.userRole === 'OWNER'

  useEffect(() => {
    if (modal?.mode !== 'edit' || !modal.walletId) return undefined

    let active = true
    walletApi.listMembers(modal.walletId)
      .then((loadedMembers) => {
        if (active) setMembers(loadedMembers)
      })
      .catch((membersLoadError) => {
        if (active) {
          setMembersError(membersLoadError.message || 'Não foi possível carregar os membros.')
        }
      })

    return () => {
      active = false
    }
  }, [modal])

  function closeModal() {
    setModal(null)
    setName('')
    setDescription('')
    setError('')
    setMembers([])
    setMembersError('')
    setMemberEmail('')
    setMemberRole('VIEWER')
  }

  function openCreateModal() {
    closeModal()
    setListError('')
    setModal({ mode: 'create' })
  }

  function openEditModal(wallet) {
    setName(wallet.name)
    setDescription(wallet.description || '')
    setError('')
    setListError('')
    setMembersError('')
    setModal({ mode: 'edit', walletId: wallet.id })
  }

  function addMemberToForm() {
    if (!memberEmail.trim()) {
      setMembersError('Informe o e-mail do membro.')
      return
    }

    setMembers((currentMembers) => [
      ...currentMembers,
      { email: memberEmail.trim(), role: memberRole, pending: true },
    ])
    setMemberEmail('')
    setMemberRole('VIEWER')
    setMembersError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (modal.mode === 'create') {
        const createdWallet = await walletApi.create({
          name: name.trim(),
          description: description.trim() || null,
        })
        const pendingMembers = members.filter((member) => member.pending)
        for (const member of pendingMembers) {
          await walletApi.addMember(createdWallet.id, {
            email: member.email,
            role: member.role,
          })
        }
        await reloadWallets(createdWallet.id)
      } else {
        await walletApi.update(modal.walletId, {
          name: name.trim(),
          description: description.trim() || null,
        })
        await reloadWallets(modal.walletId)
      }
      closeModal()
    } catch (submitError) {
      setError(submitError.message || 'Não foi possível salvar a carteira.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(wallet) {
    if (!window.confirm(`Excluir a carteira "${wallet.name}"?`)) return

    try {
      await walletApi.remove(wallet.id)
      await reloadWallets()
    } catch (deleteError) {
      setListError(deleteError.message || 'Não foi possível excluir a carteira.')
    }
  }

  async function handleRoleChange(member, role) {
    try {
      const updatedMember = await walletApi.updateMemberRole(
        modal.walletId,
        member.userId,
        { role },
      )
      setMembers((currentMembers) => currentMembers.map((currentMember) => (
        currentMember.userId === member.userId ? updatedMember : currentMember
      )))
    } catch (updateError) {
      setMembersError(updateError.message || 'Não foi possível alterar o papel.')
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Remover ${member.email} da carteira?`)) return

    try {
      await walletApi.removeMember(modal.walletId, member.userId)
      setMembers((currentMembers) => currentMembers.filter(
        (currentMember) => currentMember.userId !== member.userId,
      ))
    } catch (removeError) {
      setMembersError(removeError.message || 'Não foi possível remover o membro.')
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Carteiras</h1>
        <Button type="button" onClick={openCreateModal}>Nova carteira</Button>
      </div>

      {status === 'loading' && (
        <p className="text-sm text-muted-foreground">Carregando carteiras...</p>
      )}
      {loadError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{loadError}</span>
            <Button variant="outline" size="sm" onClick={reloadWallets}>Tentar novamente</Button>
          </AlertDescription>
        </Alert>
      )}
      {listError && (
        <Alert variant="destructive">
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}
      {status === 'ready' && wallets.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma carteira cadastrada.</p>
      )}
      <div className="grid gap-3">
        {wallets.map((wallet) => (
          <div
            className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4"
            key={wallet.id}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{wallet.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {wallet.description || 'Sem descrição'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{wallet.userRole}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(wallet)}>
                Editar
              </Button>
              {wallet.userRole === 'OWNER' && (
                <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(wallet)}>
                  Excluir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'create' ? 'Nova carteira' : 'Editar carteira'}
          onClose={closeModal}
        >
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5 text-sm font-medium">
              Nome
              <input
                className="h-10 rounded-md border bg-background px-3 font-normal"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Descrição
              <input
                className="h-10 rounded-md border bg-background px-3 font-normal"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={255}
              />
            </label>

            {modal.mode === 'create' && (
              <div className="grid gap-3 border-t pt-4">
                <h3 className="text-sm font-medium">Membros (opcional)</h3>
                {members.map((member, index) => (
                  <div className="flex items-center gap-2 rounded-md border p-3" key={`${member.email}-${index}`}>
                    <span className="min-w-0 flex-1 truncate text-sm">{member.email}</span>
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMembers((currentMembers) => currentMembers.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ))}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <MemberFields
                  memberEmail={memberEmail}
                  memberRole={memberRole}
                  onEmailChange={setMemberEmail}
                  onRoleChange={setMemberRole}
                  onAdd={addMemberToForm}
                />
              </div>
            )}

            {modal.mode === 'edit' && (
              <div className="grid gap-3 border-t pt-4">
                <h3 className="text-sm font-medium">Membros</h3>
                {membersError && (
                  <Alert variant="destructive">
                    <AlertDescription>{membersError}</AlertDescription>
                  </Alert>
                )}
                {members.map((member) => (
                  <div className="flex items-center gap-2 rounded-md border p-3" key={member.userId || member.email}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.name || member.email}</p>
                      {member.name && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                    </div>
                    {member.pending ? (
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    ) : (
                      <>
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          disabled={!isOwner || member.userId === user?.id}
                          value={member.role}
                          onChange={(event) => handleRoleChange(member, event.target.value)}
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="EDITOR">EDITOR</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                        {isOwner && member.userId !== user?.id && (
                          <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveMember(member)}>
                            Remover
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {isOwner && (
                  <MemberFields
                    memberEmail={memberEmail}
                    memberRole={memberRole}
                    onEmailChange={setMemberEmail}
                    onRoleChange={setMemberRole}
                    onAdd={async () => {
                      if (!memberEmail.trim()) {
                        setMembersError('Informe o e-mail do membro.')
                        return
                      }
                      try {
                        const newMember = await walletApi.addMember(modal.walletId, {
                          email: memberEmail.trim(),
                          role: memberRole,
                        })
                        setMembers((currentMembers) => [...currentMembers, newMember])
                        setMemberEmail('')
                        setMemberRole('VIEWER')
                        setMembersError('')
                      } catch (addError) {
                        setMembersError(addError.message || 'Não foi possível adicionar o membro.')
                      }
                    }}
                  />
                )}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : modal.mode === 'create' ? 'Criar carteira' : 'Salvar alterações'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  )
}
