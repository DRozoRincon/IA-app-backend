import { Router, Response } from 'express';
import { verificaToken } from '../middleware/autenticacion';
import VisualRecognitionV3 from 'ibm-watson/visual-recognition/v3';
import SpeechToTextV1 from 'ibm-watson/speech-to-text/v1';
import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1';
import TextToSpeechV1 from 'ibm-watson/text-to-speech/v1';
import LanguageTranslatorV3 from 'ibm-watson/language-translator/v3';
import { IamAuthenticator } from 'ibm-watson/auth';
import FileSystem from '../classes/file-system';
import fs from 'fs';
import path from 'path';

const ibmRoutes = Router();
const fileSystem = new FileSystem();

ibmRoutes.post('/analisis-lenguaje', [verificaToken], (req: any, res: Response) => { // texto

    const { texto } = req.body;

    const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
        version: '2020-08-01',
        authenticator: new IamAuthenticator({
        apikey: 'ys2xpf1vI3ZLFuB2xTWNVs7p1XPVyQJ8K2yUIbYlstQG',
        }),
        serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/733eb66e-2cca-4f8c-99cf-70479b859b6a',
    });
    
    const analyzeParams = {
        'text': texto,
        'features': {
            'concepts': {
                'limit': 10
            },
            'sentiment': {},
            'categories': {
                'limit': 3
            },
            'keywords': {
                'limit': 5
            }
        }
    };
    
    naturalLanguageUnderstanding.analyze(analyzeParams)
    .then(analysisResults => {
        const resultado = analysisResults;
        res.json({
            ok: true,
            resultado: resultado.result
        })
    })
    .catch(err => {
        console.log('error:', err);
        res.status(504).json({
            ok: false,
            err
        })
    });
});

ibmRoutes.post('/traduccion', [verificaToken], async (req: any, res: Response) => { // texto, idioma a traducir
    
    const { texto, lenguaje } = req.body;
    
    const languageTranslator = new LanguageTranslatorV3({
        version: '2018-05-01',
        authenticator: new IamAuthenticator({
            apikey: 'YHW9jbWjbKdyiWFJ96x6IWaL3sQDjHlgVZ9lS8-HOq_c',
        }),
        serviceUrl: 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/a7536043-3a31-4f53-8a9d-06066fd11ef3',
    });
          
    //   IDENTIFICACION DE LENGUAJE
    const identifyParams = {
        text: texto
    };
    
    const lenguageDelTexto: any = await languageTranslator.identify(identifyParams);
    
    if(lenguageDelTexto.result.languages[0].language != 'en'){
        res.json({
            ok: false,
            mensaje: `Lo sentimos, pero solo se puede traducir de ingles a otro idioma. No se acepta el (${lenguageDelTexto.result.languages[0].language})`
        });
    }else{
        //   TRADUCCION
        const translateParams: any = {
            text: texto,
            modelId: lenguaje,
        };
              
        languageTranslator.translate(translateParams)
        .then(translationResult => {
            res.json({
                ok: true,
                resultado: translationResult.result.translations[0].translation
            })
        })
        .catch(err => {
            res.status(504).json({
                ok: false,
                err
            })
        });
    }        
});

ibmRoutes.post('/texto-discurso', [verificaToken], async (req: any, res: Response) => { // texto, voice, usuarioID
    
    const { texto, voz, lenguaje } = req.body;

    const textToSpeech = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: '_TM1TZGwqVm9zugs9j4P2nH2zfdiC0_-poLZv_Ckb8IZ',
        }),
        serviceUrl: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/ee90a0fd-f206-44ab-a89b-1b9c151c23d3',
    });

    const languageTranslator = new LanguageTranslatorV3({
        version: '2018-05-01',
        authenticator: new IamAuthenticator({
            apikey: 'YHW9jbWjbKdyiWFJ96x6IWaL3sQDjHlgVZ9lS8-HOq_c',
        }),
        serviceUrl: 'https://api.us-south.language-translator.watson.cloud.ibm.com/instances/a7536043-3a31-4f53-8a9d-06066fd11ef3',
    });

    //IDENTIFICACION DE LENGUAJE
    const identifyParams = {
        text: texto
    };
    
    const lenguageDelTexto: any = await languageTranslator.identify(identifyParams);
    
    if(lenguageDelTexto.result.languages[0].language != lenguaje){
        res.json({
            ok: false,
            mensaje: `Lo sentimos, pero el idioma del texto (${lenguageDelTexto.result.languages[0].language}) debe coincidir con la voz seleccionada (${lenguaje})`
        });
    }else{
        const synthesizeParams = {
            text: texto,
            accept: 'audio/wav',
            voice: voz,
        };
          
        textToSpeech.synthesize(synthesizeParams)
        .then((response: any) => {
            return textToSpeech.repairWavHeaderStream(response.result);
        })
        .then( async (buffer) => {
            const nombreAudio = await fileSystem.guardaAudioTemporal(buffer, req.usuario._id);
            res.json({
                ok: true,
                nombreAudio
            })
        })
        .catch(err => {
            console.log('error:', err);
            res.status(504).json({
                ok: false,
                err
            })
        });
    }
});

ibmRoutes.get('/reconocimiento-imagenes', [verificaToken], (req: any, res: Response) => { // id, imgName, 
    const { img } = req.query;

    const visualRecognition = new VisualRecognitionV3({
        version: '2018-03-19',
        authenticator: new IamAuthenticator({
        apikey: '2i55q4Ic_UnnUyzsmc2kTtbkXOqUF6l9EbCoQxFiR2qt',
        }),
        serviceUrl: 'https://api.us-south.visual-recognition.watson.cloud.ibm.com/instances/cb27a90b-8ce2-404e-83ba-12c4927b5125',
    });
    
    const pathImg = path.resolve(__dirname, '../uploads/', req.usuario._id, 'temp', img);
    const classifyParams = {
        imagesFile: fs.createReadStream(pathImg),
        threshold: 0.6,
    };
    
    visualRecognition.classify(classifyParams)
    .then(response => {
        res.json({
            ok: true,
            result: response.result.images[0].classifiers[0].classes
        });
    })
    .catch(err => {
        console.log('error:', err);
        res.status(504).json({
            ok: false,
            err
        });
    });
});

ibmRoutes.get('/discurso-texto', [verificaToken], (req: any, res: Response) => {

    const { audio } = req.query;

    const speechToText = new SpeechToTextV1({
        authenticator: new IamAuthenticator({
        apikey: '2xzZm9yjUIfJqI5NNbCclWe928QhaX7kmLL0dMqpobJ0',
        }),
        serviceUrl: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/8f5df4e7-560c-476a-82a5-c961f007d9c6',
    });
    
    const pathAudio = path.resolve(__dirname, '../uploads/', req.usuario._id, 'temp', audio);

    const recognizeParams = {
        audio: fs.createReadStream(pathAudio),
        contentType: 'audio/wav'
    };
    
    speechToText.recognize(recognizeParams)
    .then((speechRecognitionResults: any) => {
        res.json({
            ok: true,
            result: speechRecognitionResults.result.results[0].alternatives[0]
        });
    })
    .catch(err => {
        res.status(504).json({
            ok: false,
            err
        });
    });
});
export default ibmRoutes; 