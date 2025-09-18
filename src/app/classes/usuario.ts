export class Usuario {
  constructor(
    public id?: string, //uuid de auth
    public email?: string,
    public nombre?: string,
    public apellido?: string,
    public edad?: number,
    public fechaRegistro?: Date,
  ) {}
}
