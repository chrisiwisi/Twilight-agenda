import {Component, computed, inject} from '@angular/core';
import {SessionService} from "../../../services/session.service";
import {VOTE_ID, VotingService} from "src/app/services/vote.service";
import {NzCardComponent} from "ng-zorro-antd/card";
import {NzStatisticComponent} from "ng-zorro-antd/statistic";
import {NzButtonComponent} from "ng-zorro-antd/button";

@Component({
  selector: 'app-results-area',
  imports: [
    NzCardComponent,
    NzStatisticComponent,
    NzButtonComponent
  ],
  templateUrl: './results-area.html',
  styleUrl: './results-area.scss',
  providers: [
    VotingService,
    { provide: VOTE_ID, useFactory: () => inject(SessionService).session()?.voteId }
  ]
})
export class ResultsArea {
  private votingService = inject(VotingService);
  protected sessionService = inject(SessionService);

  results = computed(() => {
    const raw = this.votingService.vote()?.results;
    if (!raw) return null;
    return Object.entries(raw)
      .map(([choice, influence]) => ({ choice, influence }))
      .sort((a, b) => b.influence - a.influence); // highest first
  });

  protected startNewRound() {
    this.sessionService.resetState().then(() => console.log('State reset'));
  }
}
