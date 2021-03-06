import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { map, switchMap, take, withLatestFrom } from "rxjs/operators";
import { Film, FilmSessionTime } from "../../shared/interfaces";
import { DataService } from "../../shared/services/data.service";
import {
  FILMS_ACTIONS,
  GetCinemaList,
  GetCinemaListSuccess,
  GetFilmByTimeInterval, GetFilmByTimeIntervalSuccess, GetFilmSessionsList, GetFilmSessionsListSuccess,
  GetFilmsList,
  GetFilmsListSuccess, GetScreeningPeriodList, GetScreeningPeriodListSuccess,
  MergeGenresList, SetCinemaList,
  SetCurrentFilmsList, SetSelectedFilm, ToggleLoadingOn,
} from "../actions/films.actions";
import { selectFilmsState } from "../selectors/films.selector";
import { IAppState } from "../state/app.state";

@Injectable()
export class FilmsEffects {
  @Effect() cinemasList$ = this._actions$.pipe(
    ofType<GetCinemaList>(FILMS_ACTIONS.GET_CINEMA_LIST),
    switchMap( () => {
      return this.data.getCinemasList();
    }),
    map( cinemaList => {
      return new GetCinemaListSuccess(cinemaList);
    }),
  );

  @Effect() filmsList$ = this._actions$.pipe(
    ofType<GetFilmsList>(FILMS_ACTIONS.GET_FILMS_LIST),
    switchMap( () => {
      return this.data.getFilmsList();
    }),
    map( filmsList => {
      filmsList.forEach( film => {
              this._store.dispatch(new MergeGenresList(film.genres));
      });
      return new GetFilmsListSuccess(filmsList);
    }),
  );

  @Effect() filmListOnTime = this._actions$.pipe(
    ofType<GetFilmByTimeInterval>(FILMS_ACTIONS.GET_FILMS_BY_TIME_INTERVAL),
    withLatestFrom(this._store.pipe(select(selectFilmsState))),
    map( ([, filmsList]) => {
      this._store.dispatch(new ToggleLoadingOn(true));
      const films: Film[] = [];
      filmsList.films.forEach((film, index, arr) => {
        this.data.getFilmSessions(film.name).pipe(take(1)).subscribe((sessions: FilmSessionTime[]) => {
          const filmSession = sessions.find(session => {
            return (session.time > filmsList.minValue && session.time < filmsList.maxValue);
          });
          if (!!filmSession) {
            films.push(film);
          }
          if (!arr[index + 1]) {
            this._store.dispatch(new SetCurrentFilmsList(films));
            this._store.dispatch(new ToggleLoadingOn(false));
          }
        });
      });
      return new GetFilmByTimeIntervalSuccess();
    }),
  );

  @Effect() screeningPeriodList = this._actions$.pipe(
    ofType<GetScreeningPeriodList>(FILMS_ACTIONS.GET_SCREENING_PERIOD_LIST),
    map(action => action.payload),
    withLatestFrom(this._store.pipe(select(selectFilmsState))),
    map( ([payloadDateTime, filmsList]) => {
      this._store.dispatch(new ToggleLoadingOn(true));
      const films: Film[] = [];
      filmsList.films.forEach((film, index, arr) => {
        this.data.getScreeningPeriod(film.name).pipe(take(1)).subscribe( periodList => {
          const isFoundPeriod = periodList.find( period => {
            return (new Date(period.periodStart).getTime() <= payloadDateTime && new Date(period.periodEnd).getTime() >= payloadDateTime);
          });
          if (!!isFoundPeriod) {
            films.push(film);
          }
          if (!arr[index + 1]) {
            this._store.dispatch(new SetCurrentFilmsList(films));
            this._store.dispatch(new ToggleLoadingOn(false));
          }
        });
      });
      return new GetScreeningPeriodListSuccess();
    }),
  );

  @Effect() filmSessionList = this._actions$.pipe(
    ofType<GetFilmSessionsList>(FILMS_ACTIONS.GET_FILM_SESSIONS_LIST),
    map( action => action.payload),
    switchMap((filmID: number) => {
      this._store.dispatch(new ToggleLoadingOn(true));
      return this.data.getFilmByID(filmID);
    }),
    switchMap( (film: Film) => {
      if (!film) {
        this.router.navigate(["**"]);
        return;
      }
      this._store.dispatch(new SetSelectedFilm(film));

      return this.data.getFilmSessions(film.name);
    }),
    map( sessions => {
      sessions.forEach( session => {
          this._store.dispatch(new SetCinemaList(session.cinema));
        });
      this._store.dispatch(new ToggleLoadingOn(false));
      return new GetFilmSessionsListSuccess(sessions);
    }),
  );


  constructor(private _actions$: Actions,
              private _store: Store<IAppState>,
              private data: DataService,
              private router: Router,
              ) {
  }
}
