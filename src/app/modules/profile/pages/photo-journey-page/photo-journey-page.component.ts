import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  GetPhotoJourneyGQL,
  GetPhotoJourneyQuery,
  RegistrationStatus,
} from '@tumi/legacy-app/generated/generated';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-photo-journey-page',
  templateUrl: './photo-journey-page.component.html',
  styleUrls: ['./photo-journey-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoJourneyPageComponent {
  $data: Observable<GetPhotoJourneyQuery['currentUser']>;
  constructor(private photoQuery: GetPhotoJourneyGQL) {
    this.$data = this.photoQuery.fetch().pipe(
      map(({ data }) => data.currentUser),
      map((user) => {
        if (user) {
          return {
            ...user,
            eventRegistrations: user?.eventRegistrations.filter(
              (registraion) =>
                registraion.status !== RegistrationStatus.Cancelled
            ),
          };
        } else {
          return user;
        }
      })
    );
  }

  openPhoto(photo: {
    __typename?: 'PhotoShare';
    id: string;
    type: string;
    src: string;
    original: string;
    originalBlob: string;
    container: string;
  }): void {}
}
