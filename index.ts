import Server from './classes/server';
import userRoutes from './routes/usuario';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import postRoutes from './routes/post';
import fileUpload from 'express-fileupload';
import cors from  'cors';
import ibmRoutes from './routes/ibm';

const server = new Server();

// middlewares
server.app.use(bodyParser.urlencoded({extended: true}));
server.app.use(bodyParser.json());

// FileUpload
server.app.use(fileUpload({useTempFiles: true}));

//CORS 
server.app.use(cors());

// rutas de mi app
server.app.use('/user', userRoutes);
server.app.use('/posts', postRoutes);
server.app.use('/ia', ibmRoutes);

// conectar db
mongoose.connect('mongodb://localhost:27017/fotosgram', 
    {useNewUrlParser: true, useUnifiedTopology: true}, (err) =>{
        if(err) throw err;
        console.log('Base de datos conectada');
});


// levantando servidor express
server.start( () => {
    console.log(`Servidor corriendo en puerto ${server.port}`);
});