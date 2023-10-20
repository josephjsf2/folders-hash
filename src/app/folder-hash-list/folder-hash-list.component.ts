/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { ButtonModule } from 'primeng/button';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule } from 'primeng/toolbar';
import { TableModule } from 'primeng/table';
import { ElectronService } from '../core/services';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FileUploadModule } from 'primeng/fileupload';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

interface HashConfig {
  path: string;
  hash: string;
  updateDate: string;
  fileCount: number;
}

@Component({
  selector: 'app-folder-hash-list',
  standalone: true,
  imports: [ CommonModule,ToastModule, ProgressSpinnerModule, PanelModule, DataViewModule,DividerModule, ButtonModule, BadgeModule, TooltipModule, TagModule, ToolbarModule, TableModule, InputTextModule, FormsModule, FileUploadModule],
  templateUrl: './folder-hash-list.component.html',
  styleUrls: ['./folder-hash-list.component.scss'],
  providers: [MessageService]

})
export class FolderHashListComponent implements OnInit, OnDestroy{

  configs: HashConfig[];
  chooseFileEventRef: any;
  screenCaptureEventRef: any;
  crypto: any;
  processingCapture = false;

  constructor(
    private electronService: ElectronService,
    private cdRef: ChangeDetectorRef,
    private messageService: MessageService){}

  ngOnInit(): void {
    const cfgs = localStorage.getItem('filePaths');
    if(cfgs){
      try{
        this.configs = JSON.parse(cfgs)
      }catch(err){
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        setTimeout(()=> this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error: Unable to parse config. ${err}` }))
      }
    }else{
      this.configs = [];
    }

    // Async message handler
    if(this.electronService.isElectron){
      this.crypto = window.require('crypto');
      const {ipcRenderer} = window.require('electron');

      // Choosing file event
      this.chooseFileEventRef = ipcRenderer.on('open-folder-dialog-reply', (event:any, arg:any) => {
        if(!arg.canceled){
          const cfg = this.configs[arg.index] || {path: arg.filePaths[0], hash: '', updateDate: this.getDatetimeString(), fileCount: 0};
          if(arg.index !== undefined){
            // Modify file path
            this.configs[arg.index].path = arg.filePaths[0];
          }else{
            // New file path
            this.configs.push(cfg)
          }
          this.calculateFolderHash(cfg)
          this.cdRef.detectChanges();
        }
      })

      this.screenCaptureEventRef = ipcRenderer.on('capture-window-reply', (event:any, img:any) => {
        if(this.electronService.isElectron){
          const { clipboard } = window.require('electron');
          try{
            clipboard.writeImage(img);
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Screenshot has been copied to clipboard.' })
          }catch(e){
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            this.messageService.add({ severity: 'error', summary: 'Error', detail: `Unable to copy message ${e}` })
          }
        }
        this.processingCapture = false;
        this.cdRef.detectChanges();
      })
    }
    this.recalculate();
  }

  saveConfigs(){
    localStorage.setItem('filePaths', JSON.stringify(this.configs))
  }

  addPath(index?: number){
    if(this.electronService.isElectron){
      const {ipcRenderer} = window.require('electron');
      ipcRenderer.invoke('open-folder-dialog', index);
    }
  }

  captureWindow(){
    if(this.electronService.isElectron){
      this.processingCapture = true;
      const {ipcRenderer} = window.require('electron');
      ipcRenderer.invoke('capture-window');
      this.cdRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if(this.electronService.isElectron){
      this.chooseFileEventRef.removeAllListeners('open-folder-dialog-reply')
      this.screenCaptureEventRef.removeAllListeners('capture-window-reply')
    }
    this.cdRef.detach();
  }

  del(index: number){
    this.configs.splice(index, 1);
    this.cdRef.detectChanges();
  }

  copyText(config: HashConfig){
    if(this.electronService.isElectron){
      const { clipboard } = window.require('electron');
      clipboard.writeText(config.hash);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Copied' })
    }
  }

  calculateHashForFile(hash: any, filePath: string) {
    const fileData = this.electronService.fs.readFileSync(filePath);
    hash.update(fileData);
  }

  calculateHashForDirectory(hash: any, directoryPath:string) {
    let fileCount = 0;
    if(this.electronService.isElectron){
      const path = window.require('path');
      const files = this.electronService.fs.readdirSync(directoryPath);
      fileCount = files.length;
      files.forEach((file) => {
        const filePath: string = path.join(directoryPath, file);
        const stat = this.electronService.fs.statSync(filePath);
        if (stat.isDirectory()) {
          fileCount += this.calculateHashForDirectory(hash, filePath);
        } else {
          this.calculateHashForFile(hash, filePath);
        }
      });
    }
    return fileCount;
  }

  calculateFolderHash(config: HashConfig) {
    if(!config.path){
      return;
    }

    try{
      const hash = this.crypto.createHash('sha256');
      const fileCount = this.calculateHashForDirectory(hash, config.path);
      const folderHash = hash.digest('hex');
      if(config.hash !==folderHash){
        config.hash = folderHash;
        config.updateDate = this.getDatetimeString();
      }
      config.fileCount = fileCount
      this.cdRef.detectChanges();
    }catch(err){
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error: Unable to calculate folder hash: ${config.path} ${err}` })
    }
  }

  recalculate(){

    for(const config of this.configs){
      this.calculateFolderHash(config);
    }
  }

  getDatetimeString(){
    const date = new Date();
    return `${date.getFullYear()}/${(date.getMonth() +1) < 10 ? '0' + (date.getMonth() +1) : date.getMonth() +1}/${date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()}${date.getHours() < 10 ? ('0' + date.getHours()) : date.getHours()}:${date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes()}:${date.getSeconds() < 10 ? ('0' + date.getSeconds()) : date.getSeconds()}`
  }
}
