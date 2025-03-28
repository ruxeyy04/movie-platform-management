import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailsComponent } from './components/movie-details/movie-details.component';
import { MovieFormComponent } from './components/movie-form/movie-form.component';
import { MoviePlayerComponent } from './components/movie-player/movie-player.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ConfirmationModalComponent } from './shared/confirmation-modal/confirmation-modal.component';
import { ToastNotificationsComponent } from './shared/toast-notifications/toast-notifications.component';

@NgModule({
    declarations: [
        AppComponent,
        MovieListComponent,
        MovieDetailsComponent,
        MovieFormComponent,
        MoviePlayerComponent,
        HeaderComponent,
        FooterComponent,
        ConfirmationModalComponent,
        ToastNotificationsComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }