import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

const usuarioSchema: Schema<IUsuario> = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    avatar: {
        type: String,
        required: [true, 'El avatar es necesario']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'El correo es necesario']
    },
    contraseña: {
        type: String,
        required: [true, 'La contraseña es necesaria']
    }
});


interface IUsuario extends Document {
    nombre: string;
    avatar: string;
    email: string;
    contraseña: string;
    compararPassword(password: string): boolean;
}

usuarioSchema.method('compararPassword', function(contraseña: string = ''):boolean{
    if(bcrypt.compareSync(contraseña, this.contraseña)){
        return true;
    }else{
        return false;
    }
});

export const Usuario = model<IUsuario>('Usuario', usuarioSchema);