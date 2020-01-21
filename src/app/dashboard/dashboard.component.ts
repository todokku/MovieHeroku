import { Component, OnInit } from "@angular/core";
import { LabelType, Options } from "ng5-slider";
import { DataHandlerService } from "../shared/services/data-handler.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.less"]
})
export class DashboardComponent implements OnInit {
  private isCinemaDropdown: boolean = false;
  private isGenreDropdown: boolean = false;

  private genres: string[];
  private cinemas: string[];


  minValue: number = 0;
  maxValue: number = 86399;
  options: Options = {
    floor: 0,
    ceil: 86400,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low:
          return this.formatSecs(value);
        case LabelType.High:
          return this.formatSecs(value);
        default:
          return this.formatSecs(value);
      }
    }
  };

  pad(num: number, size: number): string {
    let s = num + "";
    while (s.length < size) { s = "0" + s; }
    return s;
  }
  formatSecs(totalsecs: number): string {
    const hour = parseInt( (totalsecs / 3600) + "", 10) % 24;
    const min = parseInt( (totalsecs / 60) + "", 10) % 60;
    const secs = totalsecs % 60;

    return this.pad(hour, 2) + ":" + this.pad(min, 2) + ":" + this.pad(secs, 2);
  }

  constructor(private dataHandler: DataHandlerService) {
    this.genres = this.dataHandler.getGenresList();
    this.cinemas = this.dataHandler.getCinemasList();
  }

  ngOnInit(): void {
  }

}
