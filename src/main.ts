import { enableProdMode, importProvidersFrom } from '@angular/core';

import { APP_CONFIG } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CoreModule } from './app/core/core.module';
import { SharedModule } from './app/shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

if (APP_CONFIG.production) {
  enableProdMode();
}

// platformBrowserDynamic()
//   .bootstrapModule(AppModule, {
//     preserveWhitespaces: false
//   })
//   .catch(err => console.error(err));
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>  new TranslateHttpLoader(http, './assets/i18n/', '.json');

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom( AppRoutingModule,
        FormsModule,
        HttpClientModule,
        CoreModule,
        SharedModule,
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: httpLoaderFactory,
            deps: [HttpClient]
          }
        })),
    ],
  });
