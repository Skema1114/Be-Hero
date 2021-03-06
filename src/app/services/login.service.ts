import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Usuario } from '../models/Usuario';
import { AlertService } from './alert.service';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private af: AngularFireAuth, private al: AlertService, private route: Router) { }

  get usuarioLogado(): firebase.User {
    return this.af.auth.currentUser;
  }

  get usuarioEmail(): string {
    return this.af.auth.currentUser.email;
  }

  public async login(email: string, senha: string) {
    const loading = await this.al.loading();
    this.af.auth.signInWithEmailAndPassword(email, senha).then(
      user => {
        loading.dismiss();
        if (user.user.emailVerified) {
          this.route.navigateByUrl('tabs/listar-heroi');
        } else {
          this.al.toast({ message: 'Pare ai guerreiro! Precisamos que confirme seu e-mail' });
          this.logout();
        }
      },
      error => {
        loading.dismiss();
        this.al.toast({ message: 'Não achamos seu usuario ou sua senha' });
      }
    );
  }

  public logout() {
    this.af.auth.signOut();
    this.route.navigate(['login']);
  }

  public async criarNovoUsuario(u: Usuario) {
    const loading = await this.al.loading();
    this.af.auth.createUserWithEmailAndPassword(u.email, u.senha).then(
      credencias => {
        credencias.user
          .updateProfile({
            displayName: u.nome
          })
          .then(() => {
            this.af.auth.currentUser.sendEmailVerification({
              url: 'http://localhost:8100'
            });
            loading.dismiss();
            this.al.alert('Bem vindo a iniciativa BeHero! Mas antes verifique seu email para continuarmos', {
              buttons: [
                {
                  text: 'Continuar',
                  handler: () => {
                    this.route.navigate(['login']);
                  }
                }
              ]
            });
          });
      },
      erro => {
        if (erro.code === 'auth/invalid-email') {
          this.al.alert('Algo errado com o email');
        }
        console.log(erro);
      }
    );
  }

  public isLogado(): Observable<boolean> {
    return this.af.authState.pipe(
      map(usuario => {
        return usuario !== null;
      })
    );
  }

  public async recuperarSenha(email: string): Promise<boolean> {
    const loading = await this.al.loading();
    return this.af.auth.sendPasswordResetEmail(email, { url: environment.fireConfig + '/login' }).then(
      res => {
        loading.dismiss();
        return true;
      },
      err => {
        loading.dismiss();
        this.al.toast({ message: err });
        return false;
      }
    );
  }
}
