import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { MessagesService } from '../services/messages.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
})
export class MessagesComponent
  implements OnInit, AfterViewInit, AfterViewChecked
{
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  @Input() user: any;
  messages: any[] = [];
  newMessage: string = '';
  private socket!: Socket;

  constructor(
    private ngZone: NgZone,
    private authService: AuthService,
    private messageService: MessagesService,
    private cd: ChangeDetectorRef
  ) {
    this.socket = io(environment.api);
  }

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.scrollToBottom();
  }
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.loadMessages();
      this.subscribeToNewMessages();

      this.cd.detectChanges();
    }
  }
  private messageSubscription: any;
  public subscribeToNewMessages(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    this.messageSubscription = this.messageService
      .getNewMessages()
      .subscribe((newMessage: any) => {
        this.ngZone.run(() => {
          const exists = this.messages.some(
            (msg) => msg._id === newMessage._id
          );
          if (
            !exists &&
            (newMessage.sender === this.user.credentials._id ||
              newMessage.receiver === this.user.credentials._id)
          ) {
            this.messages.push(newMessage);
            this.cd.detectChanges();
            this.scrollToBottom();
          }
        });
      });
  }
  loadMessages(): void {
    const senderId = this.authService.getUserDataId();
    const receiverId = this.user.credentials._id;
    if (senderId && receiverId) {
      this.messageService.getMessages(senderId, receiverId).subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.cd.detectChanges();
        },
        error: (err) => {},
      });
    }
  }

  sendMessage(): void {
    const senderId = this.authService.getUserDataId();
    const receiverId = this.user.credentials._id;

    if (!senderId || !receiverId) {
      console.error('Los IDs de ambos usuarios son necesarios.');
      return;
    }

    if (this.newMessage.trim()) {
      this.messageService
        .sendMessage(senderId, receiverId, this.newMessage)
        .subscribe({
          next: (response) => {
            const exists = this.messages.some(
              (msg) => msg._id === response.data._id
            );
            if (!exists) {
              this.messages.push(response.data);
              this.scrollToBottom(); // <-- hacer scroll al fondo
            }

            this.newMessage = '';

            this.cd.detectChanges();
          },
          error: (err) => {
            console.error('Error al enviar mensaje:', err);
          },
        });
    } else {
      alert('Escribe un mensaje.');
    }
  }
}
