import { createFileRoute } from '@tanstack/react-router'
import { route } from '@/constants/routes'
import HeaderPage from '@/containers/HeaderPage'
import SettingsMenu from '@/containers/SettingsMenu'
import { t } from 'i18next'
import { Card, CardItem } from '@/containers/Card'
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconCodeCircle,
} from '@tabler/icons-react'
import { useMCPServers, MCPServerConfig } from '@/hooks/useMCPServers'
import { useEffect, useState } from 'react'
import AddEditMCPServer from '@/containers/dialogs/AddEditMCPServer'
import DeleteMCPServerConfirm from '@/containers/dialogs/DeleteMCPServerConfirm'
import EditJsonMCPserver from '@/containers/dialogs/EditJsonMCPserver'
import { Switch } from '@/components/ui/switch'
import { twMerge } from 'tailwind-merge'
import { getConnectedServers } from '@/services/mcp'
import { useToolApproval } from '@/hooks/useToolApproval'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute(route.settings.mcp_servers as any)({
  component: MCPServers,
})

function MCPServers() {
  const { mcpServers, addServer, editServer, deleteServer } = useMCPServers()
  const { allowAllMCPPermissions, setAllowAllMCPPermissions } =
    useToolApproval()

  const [open, setOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [currentConfig, setCurrentConfig] = useState<
    MCPServerConfig | undefined
  >(undefined)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serverToDelete, setServerToDelete] = useState<string | null>(null)

  // JSON editor dialog state
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false)
  const [jsonServerName, setJsonServerName] = useState<string | null>(null)
  const [jsonEditorData, setJsonEditorData] = useState<
    MCPServerConfig | Record<string, MCPServerConfig> | undefined
  >(undefined)
  const [connectedServers, setConnectedServers] = useState<string[]>([])

  const handleOpenDialog = (serverKey?: string) => {
    if (serverKey) {
      // Edit mode
      setCurrentConfig(mcpServers[serverKey])
      setEditingKey(serverKey)
    } else {
      // Add mode
      setCurrentConfig(undefined)
      setEditingKey(null)
    }
    setOpen(true)
  }

  const handleSaveServer = (name: string, config: MCPServerConfig) => {
    if (editingKey) {
      // Edit existing server
      editServer(editingKey, config)

      // If server name changed, delete old one and add new one
      if (editingKey !== name) {
        deleteServer(editingKey)
        addServer(name, config)
      }
    } else {
      // Add new server
      addServer(name, config)
    }
  }

  const handleEdit = (serverKey: string) => {
    handleOpenDialog(serverKey)
  }

  const handleDeleteClick = (serverKey: string) => {
    setServerToDelete(serverKey)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (serverToDelete) {
      deleteServer(serverToDelete)
      setServerToDelete(null)
    }
  }

  const handleOpenJsonEditor = (serverKey?: string) => {
    if (serverKey) {
      // Edit single server JSON
      setJsonServerName(serverKey)
      setJsonEditorData(mcpServers[serverKey])
    } else {
      // Edit all servers JSON
      setJsonServerName(null)
      setJsonEditorData(mcpServers)
    }
    setJsonEditorOpen(true)
  }

  const handleSaveJson = (
    data: MCPServerConfig | Record<string, MCPServerConfig>
  ) => {
    if (jsonServerName) {
      // Save single server
      editServer(jsonServerName, data as MCPServerConfig)
    } else {
      // Save all servers
      // Clear existing servers first
      Object.keys(mcpServers).forEach((key) => {
        deleteServer(key)
      })

      // Add all servers from the JSON
      Object.entries(data as Record<string, MCPServerConfig>).forEach(
        ([key, config]) => {
          addServer(key, config)
        }
      )
    }
  }

  const toggleServer = (serverKey: string, active: boolean) => {
    if (serverKey) {
      // Save single server
      editServer(serverKey, {
        ...(mcpServers[serverKey] as MCPServerConfig),
        active,
      })
    }
  }

  useEffect(() => {
    getConnectedServers().then(setConnectedServers)

    const intervalId = setInterval(() => {
      getConnectedServers().then(setConnectedServers)
    }, 3000)

    return () => clearInterval(intervalId)
  }, [setConnectedServers])

  return (
    <div className="flex flex-col h-full">
      <HeaderPage>
        <h1 className="font-medium">{t('common.settings')}</h1>
      </HeaderPage>
      <div className="flex h-full w-full">
        <SettingsMenu />
        <div className="p-4 w-full h-[calc(100%-32px)] overflow-y-auto">
          <div className="flex flex-col justify-between gap-4 gap-y-3 w-full">
            <Card
              header={
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <h1 className="text-main-view-fg font-medium text-base">
                      MCP Servers
                    </h1>
                    <div className="flex items-center gap-0.5">
                      <div
                        className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                        onClick={() => handleOpenJsonEditor()}
                        title="Edit All Servers JSON"
                      >
                        <IconCodeCircle
                          size={18}
                          className="text-main-view-fg/50"
                        />
                      </div>
                      <div
                        className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                        onClick={() => handleOpenDialog()}
                        title="Add Server"
                      >
                        <IconPlus size={18} className="text-main-view-fg/50" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-main-view-fg/70 mt-1">
                    Find more MCP servers at{' '}
                    <a
                      href="https://mcp.so/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      mcp.so
                    </a>
                  </p>
                </div>
              }
            />

            {/* Global MCP Permission Toggle */}
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h1 className="text-main-view-fg font-medium text-base">
                      Allow All MCP Tool Permissions
                    </h1>
                    <p className="text-sm text-main-view-fg/70">
                      When enabled, all MCP tool calls will be automatically
                      approved without showing permission dialogs.
                      <span className="font-semibold text-main-view-fg">
                        {' '}
                        Use with caution
                      </span>{' '}
                      - only enable this if you trust all your MCP servers.
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <Switch
                      checked={allowAllMCPPermissions}
                      onCheckedChange={setAllowAllMCPPermissions}
                    />
                  </div>
                </div>
              }
            />

            {Object.keys(mcpServers).length === 0 ? (
              <div className="py-4 text-center font-medium text-main-view-fg/50">
                No MCP servers found
              </div>
            ) : (
              Object.entries(mcpServers).map(([key, config], index) => (
                <Card key={`${key}-${index}`}>
                  <CardItem
                    align="start"
                    title={
                      <div className="flex items-center gap-x-2">
                        <div
                          className={twMerge(
                            'size-2 rounded-full',
                            connectedServers.includes(key)
                              ? 'bg-accent'
                              : 'bg-main-view-fg/50'
                          )}
                        />
                        <h1 className="text-main-view-fg text-base capitalize">
                          {key}
                        </h1>
                      </div>
                    }
                    description={
                      <div className="text-sm text-main-view-fg/70">
                        <div>Command: {config.command}</div>
                        <div className="my-1 break-all">
                          Args: {config?.args?.join(', ')}
                        </div>
                        {config.env && Object.keys(config.env).length > 0 && (
                          <div className="break-all">
                            Env:{' '}
                            {Object.entries(config.env)
                              .map(([key, value]) => `${key}=${value}`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    }
                    actions={
                      <div className="flex items-center gap-0.5">
                        <div
                          className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                          onClick={() => handleOpenJsonEditor(key)}
                          title="Edit JSON"
                        >
                          <IconCodeCircle
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                        <div
                          className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                          onClick={() => handleEdit(key)}
                          title="Edit Server"
                        >
                          <IconPencil
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                        <div
                          className="size-6 cursor-pointer flex items-center justify-center rounded hover:bg-main-view-fg/10 transition-all duration-200 ease-in-out"
                          onClick={() => handleDeleteClick(key)}
                          title="Delete Server"
                        >
                          <IconTrash
                            size={18}
                            className="text-main-view-fg/50"
                          />
                        </div>
                        <div className="ml-2">
                          <Switch
                            checked={config.active === false ? false : true}
                            onCheckedChange={(checked) =>
                              toggleServer(key, checked)
                            }
                          />
                        </div>
                      </div>
                    }
                  />
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Use the AddEditMCPServer component */}
      <AddEditMCPServer
        open={open}
        onOpenChange={setOpen}
        editingKey={editingKey}
        initialData={currentConfig}
        onSave={handleSaveServer}
      />

      {/* Delete confirmation dialog */}
      <DeleteMCPServerConfirm
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        serverName={serverToDelete || ''}
        onConfirm={handleConfirmDelete}
      />

      {/* JSON editor dialog */}
      <EditJsonMCPserver
        open={jsonEditorOpen}
        onOpenChange={setJsonEditorOpen}
        serverName={jsonServerName}
        initialData={
          jsonEditorData as MCPServerConfig | Record<string, MCPServerConfig>
        }
        onSave={handleSaveJson}
      />
    </div>
  )
}
