import {Component, inject} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {VotingService, Ballot} from '../../../services/vote.service';
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzSpaceCompactComponent} from "ng-zorro-antd/space";
import {NzFormDirective} from "ng-zorro-antd/form";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NzInputNumberComponent} from "ng-zorro-antd/input-number";

@Component({
  selector: 'app-voting-area',
  imports: [
    NzInputDirective,
    NzButtonComponent,
    NzSpaceCompactComponent,
    NzFormDirective,
    ReactiveFormsModule,
    NzInputNumberComponent
  ],
  templateUrl: './voting-area.html',
  styleUrl: './voting-area.scss',
  providers: [VotingService],
})
export class VotingArea {
  protected sessionService = inject(SessionService);
  protected votingService = inject(VotingService);
  private formBuilder = inject(FormBuilder);

  voteForm = this.formBuilder.group({
    choice: ['', Validators.required],
    influence: [null, [Validators.required, Validators.min(0)]],
  });

  protected onSubmitVote(): void {
    if (this.voteForm.invalid) return;
    const { choice, influence } = this.voteForm.getRawValue();
    if (!choice || influence == null) {
      return console.warn('Choice and influence are required.');
    }
    const ballot: Ballot = { choice, influence };
    this.submitBallot(ballot);
  }

  protected onAbstain() {
    this.submitBallot({ choice: 'abstain', influence: 0 });
  }

  private submitBallot(ballot: Ballot) {
    const playerId = this.sessionService.getOrCreatePlayerId();
    const voteId = this.sessionService.session()?.voteId;
    if (!voteId) {
      return console.warn('No active vote found.');
    }
    this.votingService.submitVote(voteId, playerId, ballot).then();
  }
}
