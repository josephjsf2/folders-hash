import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';
import { FolderHashListComponent } from './folder-hash-list/folder-hash-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'folder-list',
    pathMatch: 'full'
  },
  {
    path:'folder-list',
    component: FolderHashListComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {}),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
