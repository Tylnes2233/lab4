export interface CharacterModel {
  id: string
  name: string
  avatar?: string
  image?: string
  description?: string
  luck?: number
  starting_coins?: number
  starting_bombs?: number
  [key: string]: unknown
}

export interface PayloadModel {
  id?: string
  name?: string
  type?: string
  code: string
}

export interface GreedStateModel {
  session_id: string
  character_id?: string
  character?: CharacterModel | null
  coins_in_machine: number
  wallet: number
  bombs: number
  jam_chance: number
  is_jammed: boolean
  message?: string
  payload?: PayloadModel | null
}

export interface DonateResponse {
  success?: boolean
  coins_in_machine: number
  wallet: number
  bombs?: number
  jam_chance?: number
  is_jammed?: boolean
  message?: string
  payload?: PayloadModel | null
}

export interface BombResponse {
  success?: boolean
  coins_in_machine: number
  wallet: number
  bombs: number
  jam_chance?: number
  is_jammed: boolean
  message?: string
}

export interface SessionValidationModel {
  valid?: boolean
  exists?: boolean
  session_id: string
  state?: GreedStateModel
}

export interface SavedSession {
  id: string
  title: string
  characterName: string
  updatedAt: string
}

export interface ToastItem {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}