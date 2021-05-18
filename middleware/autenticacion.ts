import { Response, NextFunction } from 'express';
import Token from '../classes/token';

export const verificaToken = (req: any, res: Response, next: NextFunction) => {
    const userToken = req.get('x-token') || ''; // obtenemos del header x-token

    Token.comprobarToken(userToken).then((decoded:any) => {
        req.usuario = decoded.usuario; // devuelve el usuario al que le pertenece token
        next();
    }).catch((err) => {
        res.json({
            ok: false,
            mensaje: 'Token no es correcto'
        });
    })
}