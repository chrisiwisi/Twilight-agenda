import {Pipe, PipeTransform} from '@angular/core';
import {PlayerInfo} from '../services/session.service';

@Pipe({
  name: 'playerName',
})
export class PlayerNamePipe implements PipeTransform {
  transform(playerId: string, players: Record<string, PlayerInfo> | undefined): string {
    return players?.[playerId]?.name ?? playerId;
  }
}

