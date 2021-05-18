import { FileUpload } from "../interfaces/file-upload";
import path from 'path';
import fs from 'fs';
import uniqid from 'uniqid';

export default class FileSystem{
    constructor(){}

    async guardaArchivoTemporal(file: FileUpload, userId: string){
        return await new Promise<string>((resolve, reject) => {
            const path = this.crearCarpetaUsuario(userId);
            const nombreArchivo = this.generarNombreArchivo(file.mimetype);
            file.mv(`${path}/${nombreArchivo}`, (err: any) => { // guardamos y movemos archivo a ese path
                if(err){
                    reject(err);
                }else{
                    resolve(nombreArchivo);
                }
            });
        });
    }

    async guardaAudioTemporal(audio: any, userId: string){
        const path = this.crearCarpetaUsuario(userId);
        const idUnico = uniqid();
        const nombreArchivo = `${idUnico}.wav`;
        try{
            await fs.writeFileSync(`${path}/${nombreArchivo}`, audio);
            return nombreArchivo;
        }catch(err){
            console.log(err);
        }
    }

    private crearCarpetaUsuario(userId: string){
        const pathUser = path.resolve(__dirname, '../uploads/', userId); // unir string
        const pathUserTemp = pathUser + '/temp';

        const existe = fs.existsSync(pathUser);
        if(!existe){ // creamos carpetas
            fs.mkdirSync(pathUser);
            fs.mkdirSync(pathUserTemp);
        }

        return pathUserTemp;
    }

    private generarNombreArchivo(mimetype: string){
        const nombreArr = mimetype.split('/');
        const extension = nombreArr[nombreArr.length - 1];
        const idUnico = uniqid();

        return `${idUnico}.${extension}`;
    }

    archivosDeTempHaciaPost(userId: string){
        const pathTemp = path.resolve(__dirname, '../uploads/', userId, 'temp'); 
        const pathPost = path.resolve(__dirname, '../uploads/', userId, 'posts'); 

        if(!fs.existsSync(pathTemp)){
            return [];
        }
        
        if(!fs.existsSync(pathPost)){
            fs.mkdirSync(pathPost);
        }

        const archivosTemp = this.obtenerArchivosEnTemp(userId);
        
        archivosTemp.forEach( async (file) => {
            await fs.renameSync( path.resolve(pathTemp, file), path.resolve(pathPost, file));
        });

        return archivosTemp;
    }

    private obtenerArchivosEnTemp(userId: string){
        const pathTemp = path.resolve(__dirname, '../uploads/', userId, 'temp'); 
        return fs.readdirSync(pathTemp) || [];
    }

    getFileUrl(userId: string, file: string, type: string, fileInTemp= false){

        let pathFile: any;

        if(fileInTemp){
            pathFile = path.resolve(__dirname, '../uploads/', userId, 'temp', file);
        }else{
            pathFile = path.resolve(__dirname, '../uploads/', userId, 'posts', file);
        }

        const existe = fs.existsSync(pathFile);
        if(!existe){
            if(type == 'image') return path.resolve(__dirname, '../assets/400x250.jpg');
            if(type == 'audio') return path.resolve(__dirname, '../assets/notfound.wav')
        }

        return pathFile;
    }

    borrarArchivosEnTemp(userId: string){
        const pathTemp = path.resolve(__dirname, '../uploads/', userId, 'temp');
        const files = fs.readdirSync(pathTemp);
        files.forEach((file) => {
            fs.unlinkSync(path.resolve(pathTemp, file));
        });
    }

    borrarArchivosDelPost(userId: string, files: string[]){
        const pathTemp = path.resolve(__dirname, '../uploads/', userId, 'posts');
        files.forEach((file) => {
            fs.unlinkSync(path.resolve(pathTemp, file));
        });
    }
}