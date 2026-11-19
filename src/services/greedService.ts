import { httpClient } from '../api/httpClient'
import type {
  BombResponse,
  CharacterModel,
  DonateResponse,
  GreedStateModel,
  SessionValidationModel
} from '../types/greed'

export const greedService = {
  async getCharacters(): Promise<CharacterModel[]> {
    const response = await httpClient.get<CharacterModel[] | { characters: CharacterModel[] }>(
      '/api/greed/characters'
    )
    if (Array.isArray(response.data)) {
      return response.data
    }
    if (response.data && Array.isArray(response.data.characters)) {
      return response.data.characters
    }
    return []
  },

  async createNewSession(characterId?: string): Promise<GreedStateModel> {
    const payload = characterId
      ? {
          character_id: characterId,
          character: characterId,
          character_name: characterId,
          name: characterId
        }
      : {}
    const response = await httpClient.post<GreedStateModel>('/api/greed/session/new', payload, {
      params: characterId ? { character_id: characterId, character: characterId } : undefined
    })
    return response.data
  },

  async verifySession(sessionId: string): Promise<SessionValidationModel> {
    const response = await httpClient.get<SessionValidationModel>(
      `/api/greed/session/${encodeURIComponent(sessionId)}/verify`
    )
    return response.data
  },

  async getState(): Promise<GreedStateModel> {
    const response = await httpClient.get<GreedStateModel>('/api/greed/state')
    return response.data
  },

  async selectCharacter(characterId: string): Promise<GreedStateModel> {
    const response = await httpClient.post<GreedStateModel>(
      '/api/greed/select-character',
      {
        character_id: characterId,
        character: characterId,
        character_name: characterId,
        name: characterId
      },
      {
        params: {
          character_id: characterId,
          character: characterId
        }
      }
    )
    return response.data
  },

  async donate(amount = 1): Promise<DonateResponse> {
    const response = await httpClient.post<DonateResponse>('/api/greed/donate', { amount })
    return response.data
  },

  async useBomb(): Promise<BombResponse> {
    const response = await httpClient.post<BombResponse>('/api/greed/bomb')
    return response.data
  },

  async resetRun(characterId?: string): Promise<GreedStateModel> {
    const payload = characterId
      ? {
          character_id: characterId,
          character: characterId,
          character_name: characterId,
          name: characterId
        }
      : {}
    const response = await httpClient.post<GreedStateModel>('/api/greed/reset', payload, {
      params: characterId ? { character_id: characterId, character: characterId } : undefined
    })
    return response.data
  }
}