import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date | string | undefined, ...args: unknown[]): unknown {
    if (!value) {
      return 'Fecha no disponible'; // O cualquier texto que prefieras mostrar
    }

    const dateValue = new Date(value);
    const now = new Date();
    const timeDiff = Math.floor((now.getTime() - dateValue.getTime()) / 1000); // diferencia en segundos

    let interval: number;
    let unit: string;

    if (timeDiff < 60) {
      return timeDiff === 1 ? 'hace un segundo' : `hace ${timeDiff} segundos`;
    } else if (timeDiff < 3600) { // menos de una hora
      interval = Math.floor(timeDiff / 60);
      return interval === 1 ? 'hace un minuto' : `hace ${interval} minutos`;
    } else if (timeDiff < 86400) { // menos de un día
      interval = Math.floor(timeDiff / 3600);
      return interval === 1 ? 'hace una hora' : `hace ${interval} horas`;
    } else if (timeDiff < 604800) { // menos de una semana
      interval = Math.floor(timeDiff / 86400);
      return interval === 1 ? 'hace un día' : `hace ${interval} días`;
    } else {
      return dateValue.toLocaleString(); // fecha exacta
    }
  }

}
