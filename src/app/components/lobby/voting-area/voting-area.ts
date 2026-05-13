import {Component, computed, inject, signal} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {VotingService, Ballot, VOTE_ID} from '../../../services/vote.service';
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from "ng-zorro-antd/form";
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {NzInputNumberComponent} from "ng-zorro-antd/input-number";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {PlayerList} from "../../player-list/player-list";
import {NzRadioComponent, NzRadioGroupComponent} from "ng-zorro-antd/radio";

@Component({
  selector: 'app-voting-area',
  imports: [
    NzInputDirective,
    NzButtonComponent,
    NzFormDirective,
    ReactiveFormsModule,
    NzInputNumberComponent,
    NzFormItemComponent,
    NzFormControlComponent,
    NzIconDirective,
    PlayerList,
    NzRadioGroupComponent,
    NzRadioComponent,
  ],
  templateUrl: './voting-area.html',
  styleUrl: './voting-area.scss',
  providers: [
    VotingService,
    { provide: VOTE_ID, useFactory: () => inject(SessionService).session()?.voteId }
  ]
})
export class VotingArea {
  protected sessionService = inject(SessionService);
  protected votingService = inject(VotingService);
  private formBuilder = inject(FormBuilder);

  private submitted = signal(false);

  voteForm = this.formBuilder.group({
    choice: ['', Validators.required],
    influence: [null, [Validators.required, Validators.min(0)]],
  });

  voteType = computed(() => this.votingService.vote()?.type);

  playerChoices = computed(() => {
    const players = this.sessionService.session()?.players ?? {};
    return Object.entries(players).map(([id, info]) => ({ id, name: info.name }));
  });

  // green once session confirms player.voted === true
  confirmedBySession = computed(() => {
    const playerId = this.sessionService.getOrCreatePlayerId();
    return this.sessionService.session()?.players?.[playerId]?.voted === true;
  });

  hasVoted = computed(() => this.submitted() || this.confirmedBySession());

  protected onSubmitVote(): void {
    if (this.voteForm.invalid) return;
    const { choice, influence } = this.voteForm.getRawValue();
    if (!choice || influence == null) {
      return console.warn('Choice and influence are required.');
    }
    const ballot: Ballot = { choice, influence, playerId: this.sessionService.getOrCreatePlayerId() };
    this.submitBallot(ballot);
  }

  protected onAbstain() {
    this.submitBallot({ choice: 'abstain', influence: 0, playerId: this.sessionService.getOrCreatePlayerId() });
  }

  private submitBallot(ballot: Ballot) {
    this.votingService.submitVote(ballot)
      .then(() => this.submitted.set(true));
  }
}
