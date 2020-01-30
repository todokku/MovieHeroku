import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BookingInfo } from "../shared/interfaces";
import { DataHandlerService } from "../shared/services/data-handler.service";

@Component({
  selector: "app-booking-page",
  templateUrl: "./booking-page.component.html",
  styleUrls: ["./booking-page.component.less"]
})
export class BookingPageComponent implements OnInit, OnDestroy {

  @ViewChild("platform", {static: false}) pRef: ElementRef;

  /** @internal */
  public bookingInfo: BookingInfo;
  /** @internal */
  public dateNow: Date = new Date();
  /** @internal */
  public price = 0;

  places = new Map();
  /** @internal */
  public placesEntries = [];

  private countPlacesInRow: number[] = [];
  form: FormGroup;
  private rowIdx = 1;

  constructor(private dataHandler: DataHandlerService,
              private route: ActivatedRoute,
              private router: Router) {
    this.bookingInfo = this.dataHandler.bookingInfo;
    if (!this.bookingInfo) {
      const filmID = this.route.snapshot.params.id;
      this.router.navigate(["film-information", filmID]);
    }
  }

  ngOnInit(): void {
    this.bookingInfo.session.hall.places.forEach( (row, idx) => {
      this.countPlacesInRow[idx] = row.length;
    });

    this.form = new FormGroup({
      row: new FormControl( null,
        [
          Validators.required,
          Validators.min(1),
          Validators.max( this.bookingInfo.session.hall.places.length ),
        ]),
      place: new FormControl(null,
        [
          Validators.required,
          Validators.min(1),
          Validators.max( this.countPlacesInRow[this.rowIdx] ),
        ])
    });
  }


  getEventTargetValue(event: Event): number {
    return +(<HTMLInputElement>event.target).value;
  }

  choosePlace(): void {
    // проверка на выход за количество рядов и сидений
    const row: number = +this.form.value.row;
    const place: number = +this.form.value.place;

    if (this.form.valid) {
      // если место уже выбрано или куплено
      if (this.bookingInfo.session.hall.places[row - 1][place - 1] === 1 || this.bookingInfo.session.hall.places[row - 1][place - 1] === 2) {
        return;
      }
      this.bookingInfo.session.hall.places[row - 1][place - 1] = 1;

      const value = this.places.has(row) ? this.places.get(row) : [];
      this.places.set(row, value.concat([place]).sort());
      this.placesEntries = Array.from(this.places.entries());

      this.form.reset();
      this.price += this.bookingInfo.session.hall.price;
    }
  }

  ngOnDestroy(): void {
    // убираем выбранные места
    if (this.bookingInfo) {
      this.bookingInfo.session.hall.places = this.bookingInfo.session.hall.places.map( row => {
        return row.map( place => place === 1 ? 0 : place);
      });
    }
  }

  removeChoicePlace(row: number, place: number): void {
    this.bookingInfo.session.hall.places[row - 1][place - 1] = 0;
    const newPlaces = Array.from(this.places.get(row)).filter( seat => {
      return seat !== place;
    });
    if (newPlaces.length === 0) {
      this.places.delete(row);
    } else {
      this.places.set(row, newPlaces);
    }
    this.placesEntries = Array.from(this.places.entries());
    this.price -= this.bookingInfo.session.hall.price;
  }

  choosePlaceOnClick(row: number, place: number): void {
    if (this.bookingInfo.session.hall.places[row - 1][place - 1] === 2) {
      return;
    }
    if ( this.bookingInfo.session.hall.places[row - 1][place - 1] === 1) {
      this.removeChoicePlace(+row, +place);
      return;
    }
    this.form.patchValue({row: +row});
    this.form.patchValue({place: +place});

    this.choosePlace();
  }

  buyTickets(): void {
    this.bookingInfo.session.hall.places = this.bookingInfo.session.hall.places.map( row => {
      return row.map( seat => seat === 1 ? 2 : seat);
    });
    this.placesEntries = [];
    this.places.clear();
    this.price = 0;
  }
}
