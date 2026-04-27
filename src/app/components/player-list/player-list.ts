import {Component, computed, inject, input, InputSignal} from '@angular/core';
import {NzListComponent, NzListItemComponent} from "ng-zorro-antd/list";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SessionService} from "../../services/session.service";

@Component({
  selector: 'app-player-list',
  imports: [
    NzListComponent,
    NzListItemComponent,
    NzIconDirective
  ],
  templateUrl: './player-list.html',
  styleUrl: './player-list.scss',
})
export class PlayerList {
  showVotingStatus: InputSignal<boolean> = input<boolean>(false);

  sessionService: SessionService = inject(SessionService);

  protected players = computed(() => {
    if (!this.sessionService.session()) {
      return null;
    }
    return Object.entries(this.sessionService.session()!.players)
      .map(([id, info]) => ({id, info}));
  });
}
