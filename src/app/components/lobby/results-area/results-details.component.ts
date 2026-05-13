import {Component, inject} from "@angular/core";
import {NzListComponent, NzListItemComponent} from "ng-zorro-antd/list";
import {VotingService} from "../../../services/vote.service";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {PlayerNamePipe} from "../../../pipes/player-name.pipe";
import {toSignal} from "@angular/core/rxjs-interop";
import {SessionService} from "../../../services/session.service";


@Component({  selector: 'app-results-details',
  imports: [
    NzListComponent,
    NzListItemComponent,
    NzTagComponent,
    PlayerNamePipe,
  ],
  templateUrl: './results-details.html',
  styleUrl: './results-details.scss'
})
export class ResultsDetails {

  protected sessionService = inject(SessionService);
  private votingService = inject(VotingService);

  ballots = toSignal(this.votingService.getVoteDetails(), { initialValue: [] });
}


