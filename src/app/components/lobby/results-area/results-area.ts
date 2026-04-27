import {Component, computed, inject} from '@angular/core';
import {SessionService} from "../../../services/session.service";
import {VOTE_ID, VotingService} from "src/app/services/vote.service";
import {NzCardComponent} from "ng-zorro-antd/card";
import {NzStatisticComponent} from "ng-zorro-antd/statistic";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {ResultsComponent} from "./app-results.component";

@Component({
  selector: 'app-results-area',
  imports: [
    NzCardComponent,
    NzStatisticComponent,
    NzButtonComponent,
    ResultsComponent
  ],
  templateUrl: './results-area.html',
  styleUrl: './results-area.scss',
  providers: [
    VotingService,
    { provide: VOTE_ID, useFactory: () => inject(SessionService).session()?.voteId }
  ]
})
export class ResultsArea {
  protected sessionService = inject(SessionService);

  protected startNewRound() {
    this.sessionService.resetState().then(() => console.log('State reset'));
  }
}
