import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from '@/locales/en/common.json'
import idCommon from '@/locales/id/common.json'
import vnCommon from '@/locales/vn/common.json'
import jpCommon from '@/locales/jp/common.json'
import enChat from '@/locales/en/chat.json'
import idChat from '@/locales/id/chat.json'
import vnChat from '@/locales/vn/chat.json'
import jpChat from '@/locales/jp/chat.json'
import enSettings from '@/locales/en/settings.json'
import idSettings from '@/locales/id/settings.json'
import vnSettings from '@/locales/vn/settings.json'
import jpSettings from '@/locales/jp/settings.json'

import { localStorageKey } from '@/constants/localStorage'

const stored = localStorage.getItem(localStorageKey.settingGeneral)
const parsed = stored ? JSON.parse(stored) : {}
const defaultLang = parsed?.state?.currentLanguage

i18n.use(initReactI18next).init({
  resources: {
    en: {
      chat: enChat,
      common: enCommon,
      settings: enSettings,
    },
    id: {
      chat: idChat,
      common: idCommon,
      settings: idSettings,
    },
    vn: {
      chat: vnChat,
      common: vnCommon,
      settings: vnSettings,
    },
    jp: {
      chat: jpChat,
      common: jpCommon,
      settings: jpSettings,
    },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  ns: ['chat', 'common', 'settings'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
