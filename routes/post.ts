import { Router, Response } from 'express';
import FileSystem from '../classes/file-system';
import { FileUpload } from '../interfaces/file-upload';
import { verificaToken } from '../middleware/autenticacion';
import { Post } from '../models/post.model';

const postRoutes = Router();
const fileSystem = new FileSystem();

postRoutes.get('/', [verificaToken], async (req: any, res: Response) => {
    let pagina = Number(req.query.pagina) || 1;
    let usuario = req.query.usuario;
    let filtro = {};
    
    if(usuario) filtro = {usuario};
    
    const posts = await Post.find(filtro).sort({_id: -1}).skip(10*(pagina - 1)).limit(10).populate('usuario', '-password').exec();

    res.json({
        ok: true,
        pagina,
        posts
    })
});

postRoutes.post('/create', [verificaToken], async (req: any, res: Response) => {
    const body = req.body;

    const files = await fileSystem.archivosDeTempHaciaPost(req.usuario._id);
    
    body.files = files;
    body.usuario = req.usuario._id;

    Post.create(body).then(async postDB => {
        await postDB.populate('usuario', '-password').execPopulate();
        res.json({
            ok: true,
            post: postDB
        });
    });
});


postRoutes.delete('/eliminar-post/:idpost/:iduser', [verificaToken], async (req: any, res: Response) => {
    const { idpost, iduser } = req.params;
    if(iduser == req.usuario._id){
        let post: any = await Post.findByIdAndDelete(idpost);
        if(post.files.length != 0) await fileSystem.borrarArchivosDelPost(iduser, post.files)
        res.json({
            ok: true
        })
    }else{
        res.json({
            ok: false
        })
    }
});
//Servicio para subir archivos 

postRoutes.post('/upload', [verificaToken], async (req: any, res: Response) => {

    const { type } = req.query;

    if(!req.files){
        return res.status(400).json({
            ok: false,
            mensaje: 'No se subio ningun archivo'
        });
    }

    const file: FileUpload = req.files.image;
    
    if(!file){
        return res.status(400).json({
            ok: false,
            mensaje: 'No se subio ningun archivo'
        });
    }

    if(!file.mimetype.includes(type)){
        return res.status(400).json({
            ok: false,
            mensaje: `Lo que subio no es un ${type}`
        })
    }

    const nombreArchivo = await fileSystem.guardaArchivoTemporal(file, req.usuario._id);
    
    res.json({
        ok: true,
        file: type,
        nombreArchivo
    })
});

postRoutes.delete('/delete-files-temp', [verificaToken], (req: any, res: Response) => {
    fileSystem.borrarArchivosEnTemp(req.usuario._id);

    res.json({
        ok: true,
        mensaje: 'No fue publicado el post, por lo que los archivos subidos se han eliminado!'
    })
});

postRoutes.get('/file/:userId/:archivo/:type', (req: any, res: Response) => {
    const {userId, archivo, type} = req.params;
    const { temp } = req.query;

    const pathFile = fileSystem.getFileUrl(userId, archivo, type, temp);

    res.sendFile(pathFile);

});


export default postRoutes;