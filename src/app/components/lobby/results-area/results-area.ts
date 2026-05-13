import {Component, inject} from '@angular/core';
import {SessionService} from "../../../services/session.service";
import {VOTE_ID, VotingService} from "src/app/services/vote.service";
import {NzCardComponent} from "ng-zorro-antd/card";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {ResultsComponent} from "./app-results.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzModalModule} from "ng-zorro-antd/modal";
import {ResultsDetails} from "./results-details.component";

@Component({
  selector: 'app-results-area',
  imports: [
    NzCardComponent,
    NzButtonComponent,
    ResultsComponent,
    NzIconDirective,
    NzModalModule,
    ResultsDetails,
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
  protected detailsVisible = false;

  protected startNewRound() {
    this.sessionService.resetState().then(() => console.log('State reset'));
  }

  protected openResultDetails() {
    this.detailsVisible = true;
  }
}
