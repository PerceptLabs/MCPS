import {
  EngineManager,
  ErrorCode,
  MessageStatus,
  ThreadMessage,
} from '@janhq/core'

import { useAtomValue, useSetAtom } from 'jotai'

import AutoLink from '@/containers/AutoLink'
import ModalTroubleShooting, {
  modalTroubleShootingAtom,
} from '@/containers/ModalTroubleShoot'

import { MainViewState } from '@/constants/screens'

import { mainViewStateAtom } from '@/helpers/atoms/App.atom'

import { selectedSettingAtom } from '@/helpers/atoms/Setting.atom'
import { activeThreadAtom } from '@/helpers/atoms/Thread.atom'

const ErrorMessage = ({ message }: { message: ThreadMessage }) => {
  const setModalTroubleShooting = useSetAtom(modalTroubleShootingAtom)
  const setMainState = useSetAtom(mainViewStateAtom)
  const setSelectedSettingScreen = useSetAtom(selectedSettingAtom)
  const activeThread = useAtomValue(activeThreadAtom)

  const getErrorTitle = () => {
    switch (message.error_code) {
      case ErrorCode.Unknown:
        return 'Apologies, something’s amiss!'
      case ErrorCode.InvalidApiKey:
      case ErrorCode.AuthenticationError:
      case ErrorCode.InvalidRequestError:
        return (
          <span data-testid="invalid-API-key-error">
            Invalid API key. Please check your API key from{' '}
            <button
              className="font-medium text-[hsla(var(--app-link))] underline"
              onClick={() => {
                setMainState(MainViewState.Settings)

                if (activeThread?.assistants[0]?.model.engine) {
                  const engine = EngineManager.instance().get(
                    activeThread.assistants[0].model.engine
                  )
                  engine?.name && setSelectedSettingScreen(engine.name)
                }
              }}
            >
              Settings
            </button>{' '}
            and try again.
          </span>
        )
      default:
        return (
          <>
            {message.content[0]?.text?.value && (
              <AutoLink text={message.content[0].text.value} />
            )}
          </>
        )
    }
  }

  return (
    <div className="mt-10">
      {message.status === MessageStatus.Error && (
        <div
          key={message.id}
          className="mx-6 flex flex-col items-center space-y-2 text-center font-medium text-[hsla(var(--text-secondary))]"
        >
          {getErrorTitle()}
          <p>
            {`Something's wrong.`} Access&nbsp;
            <span
              className="cursor-pointer text-[hsla(var(--app-link))] underline"
              onClick={() => setModalTroubleShooting(true)}
            >
              troubleshooting assistance
            </span>
            &nbsp;now.
          </p>
          <ModalTroubleShooting />
        </div>
      )}
    </div>
  )
}
export default ErrorMessage
