import * as FfmpegCommand from "fluent-ffmpeg"
import { Readable } from "node:stream"
import YTDlpWrap from "yt-dlp-wrap"


export function createHash(seed = null) {
  seed = seed ?? crypto.randomUUID()
  return crypto.randomUUID()
  //return crypto.createHash('md5').update(seed).digest('hex')
}

/**
 * Convierte un buffer en un ReadableStream
 */
export const bufferToStream = (buffer: Buffer) => {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

/**
 * Convierte a mp3 una cancion
 * - No video
 * - AudioFrequency 44100
 * - AudioChannels 2
 * - Bitrate 192k
 */
export const toMp3 = (stream: Readable) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks = []

    const command = FfmpegCommand(stream)
    
    // ffmpeg -i <filePath> -vn -ar 44100 -ac 2 -b:a 192k <output>.mp3
    command.noVideo()
      .audioChannels(2)
      .audioBitrate('192k')
      .audioFrequency(44100)
      .audioCodec('libmp3lame')
      .toFormat('mp3')
      .pipe()
      .on('data', (data) => chunks.push(data))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(Buffer.concat(chunks)))
  })
}

/**
 * Obtiene la duración en segundos de un archivo de audio representado en un buffer asumiendo que:
 * - El archivo esta en formato .mp3
 * - Su Bitrate es de 192k
 */
export const getDurationInSeconds = (buffer: Buffer) => {
  const bitrate = 192 * 1000;
  const bufferSize = new Blob([buffer]).size * 8
  return bufferSize / bitrate
}

/**
 * Descarga de YouTube un video en formato mp3
 * - Get yt-dlp binary from: https://github.com/yt-dlp/yt-dlp/releases
 */
export const downloadFromYoutube = (url: string) => {
  
  const ytDlpWrap = new YTDlpWrap('./yt-dlp')
  const chunks = []

  return new Promise<Buffer>((resolve, reject) => {
    ytDlpWrap.execStream([
      url,
      '-f',
      'bestaudio/best',
      '--audio-multistreams',
      /* '-o',
      filenamePath */
    ])
    .on('data', (data) => chunks.push(data))
    .on('end', () => resolve(Buffer.concat(chunks)))
    .on('error', (error) => reject(error))
  })
}

/**
 * Obtiene la informacion de un video de YouTube
 */
export const getVideoInfo = async (url: string) => {
  const ytDlpWrap = new YTDlpWrap('./yt-dlp')
  return await ytDlpWrap.getVideoInfo(url)
}
