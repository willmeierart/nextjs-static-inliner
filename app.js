const find = require('find')
const fs = require('fs')
const file = require('file')

let newFileName = 'smc_lp_02.html'
let sourceFileNamePlusParentDir = 'index/index.html'

MSify(newFileName, sourceFileNamePlusParentDir)

function MSify (newFileName, sourceFileNamePlusParentDir) {
  const headTagFinder = /\<link rel="preload(.*?)as="script"\/\>/g
  const scriptFinder = /(<script async="" id="__NEXT_PAGE|([^"]<script src="\/_next))([^]*?)\>\<\/script\>/g
  const srcFinder = /(?<=src="\/).*?(?=")/

  const outputDir = 'missionsuiteready'
  const msHTMLfile = 'HEAD_SCRIPTS.html'

  let transformedFileTxt = ''

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  const writeNewFile = async () => {
    const outputFolderAbsPath = file.path.join(__dirname, outputDir)
    const outputFileAbsPath = file.path.join(outputFolderAbsPath, newFileName).replace(' ', '\ ')
    if (!fs.existsSync(outputFolderAbsPath)) {
      try {
        await fs.mkdirSync(outputFolderAbsPath)
        fs.writeFileSync(outputFileAbsPath, transformedFileTxt)
      } catch (e) { console.log(e) }
    } else {
      if (fs.existsSync(outputFileAbsPath)) {
        try {
          await fs.unlinkSync(outputFileAbsPath)
        } catch (e) {
          console.log(e)
        }
      }
      try {
        fs.writeFileSync(outputFileAbsPath, transformedFileTxt)
      } catch (e) {
        console.log(e)
      }
    }
  }

  const handleExtraTagsFor = async () => {
    // add missionsuite specific html
    await find.file(msHTMLfile, __dirname, htmlFiles => {
      if (htmlFiles.length > 0) {
        const htmlHeadFile = htmlFiles.pop()
        fs.readFile(htmlHeadFile, 'utf8', (err, htmlHeadContent) => {
          if (err) {
            console.log(err)
          } else {
            transformedFileTxt = transformedFileTxt.replace('</head>', `${htmlHeadContent}</head>`)
            writeNewFile() // HOW TO GET OUT OF HERE AND BELOW AND MAKE IT ALL RUN ONCE
          }
        })
      } else {
        console.log('no htmlFiles')
        writeNewFile()
      }
      
    })
  }

  const findAndDelete = async set => {
    asyncForEach(set, async (item, i) => {
      transformedFileTxt = transformedFileTxt.replace(item, '')
    })
  }

  const runTheMachineOn = async transformedFileTxt => {
    const scriptMatches = transformedFileTxt.match(scriptFinder)
    if (scriptMatches.length > 0) {
      await findAndDelete(scriptMatches)
    }
    const headTagMatches = transformedFileTxt.match(headTagFinder)
    if (headTagMatches.length > 0) {
      await findAndDelete(headTagMatches)
    }
    await handleExtraTagsFor(transformedFileTxt)
  }

  const getHTMLtxtContent = async sourceFile => {
    // get txtContent of original HTML
    try {
      fs.readFile(sourceFile, 'utf8', async (err, sourceFileTxt) => {
        if (err) console.log(err)
        else {
          transformedFileTxt = sourceFileTxt
          runTheMachineOn(transformedFileTxt)
        }
      })
    } catch(e) { console.log(e) }
  }

  const checkFoldersForMatchedFiles = async (fileName, parentDir) => {
    try {
      await file.walkSync(__dirname, (walkDirPath, walkDirs, walkFiles) => {
        // recursively check folders for files that match
        const matchedFiles = walkFiles.filter(f => f === fileName)
        const walkParentDir = walkDirPath.split('/').pop()
        const isntPageFolder = walkDirPath.indexOf('page') === -1
        if (matchedFiles.length > 0 && walkParentDir === parentDir && isntPageFolder) {
          const sourceFile = file.path.join(walkDirPath, matchedFiles.pop())
          getHTMLtxtContent(sourceFile)
        }
      })
    } catch (e) { console.log(e) }
  }

  const transformer = async fileNamePlusParentDir => {
    // use parentDir also because next/static outputs all files as index
    const splitFileName = fileNamePlusParentDir.split('/')
    const fileName = splitFileName[1]
    const parentDir = splitFileName[0]
    checkFoldersForMatchedFiles(fileName, parentDir)
  }

  transformer(sourceFileNamePlusParentDir)
}

module.exports = MSify
