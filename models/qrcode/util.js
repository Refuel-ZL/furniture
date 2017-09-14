var utils = {}
var path = require('path')
var qr = require('qr-image')
var PImage = require('pureimage')
var concat = require('concat-stream')
var PNG = require('pngjs').PNG
var Bitmap = require('./bitmap')

/**
 * 根据地址生成二维码
 * 参数 url(string) 地址 option.text 文本
 */
utils.createQr = function(url, option) {

    return new Promise((res, rej) => {
        var qr_png = qr.image(url, {
            type: 'png',
            margin: 1,
            parse_url: true,
            size: 6
        })
        let w = option['width'] || 256
        let h = option['height'] || 256
        let text = option['text'] || ''
        try {
            qr_png.pipe(new PNG()).on('parsed', function() {
                var bitmap = new Bitmap(this.width, this.height)
                for (var i = 0; i < bitmap.data.length; i++) {
                    bitmap.data[i] = this.data[i]
                }
                var img = bitmap
                var img2 = PImage.make(w, h)
                var fnt = PImage.registerFont(path.join(__dirname, '../../public/font/msyh.ttf'));
                fnt.load(function() {
                    var c = img2.getContext('2d')
                    c.fillStyle = '#FFFFFF'
                    c.fillRect(0, 0, w, h)
                    c.font = "18pt";
                    c.fillStyle = '#000000';
                    c.fillText(text, (w - text.length * 15) / 2, img.height + 35);
                    c.drawImage(img, 0, 0, img.width, img.height, (w - img.width) / 2, 10, img.width, img.height)
                    c.textAlign = 'center'
                    c.textBaseline = 'middle'
                    PImage.encodePNGToStream(img2, concat(function(text) {
                        res(text)
                    }))
                })

            })
        } catch (error) {
            rej(error)
        }

    })
}


exports = module.exports = utils