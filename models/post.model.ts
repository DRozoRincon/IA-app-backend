import { Schema, model, Document } from 'mongoose';

const postSchema = new Schema({
    created: {
        type: Date
    },
    textoPost: {
        type: String
    },
    files: [{
        type: String
    }],
    coords: {
        type: String
    },
    tipoFile: {
        type: String
    },
    tipoPublicacion: {
        type: String
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Debe existir referencia a un usuario']
    }
})

postSchema.pre<IPost>('save', function(next){ // cada creacion de post agrega automaticamente la fecha de creacion
    this.created = new Date();
    next();
})

interface IPost extends Document{
    created: Date;
    files: string[];
    coords: string;
    tipoPublicacion: string;
    tipoFile: string;
    textoPost: string;
    usuario: string;
}

export const Post = model<IPost>('Post', postSchema);