import { DeleteOutline } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import { t } from 'i18next';
import React, { useState } from 'react';
import { ContextTypes } from '../../../main/types/app-types';
import Logo from '../../../../assets/proto2-1.png';

function ContextInputArea(props: {
  setFilePaths: any;
  filePaths: string[];
  contextType: ContextTypes;
  imageList: (string | ArrayBuffer | null)[];
  setContextType: any;
  setImageList: any;
}) {
  const {
    setFilePaths,
    filePaths,
    contextType,
    setContextType,
    setImageList,
    imageList,
  } = props;
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  const removeFile = (index: number) => {
    const newFilePaths = filePaths.filter((_, i) => i !== index);
    setFilePaths(newFilePaths);
    window.electron.store.set('promptContextFile', newFilePaths);
    // if empty, set context type to empty
    if (newFilePaths.length === 0) {
      setContextType('empty');
    }
  };
  const removeImage = (index: number) => {
    const newImageList = imageList.filter((_, i) => i !== index);
    setImageList(newImageList);
    window.electron.store.set('promptImages', newImageList);
    // if empty, set context type to empty
    if (newImageList.length === 0) {
      setContextType('empty');
    }
  };

  const handleDrop = (event: any) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const { files } = event.dataTransfer;

    if (files.length > 0) {
      // check file type
      const file = files[0];
      const fileType = file.type;
      if (fileType.includes('image')) {
        setContextType('image');
        setFilePaths('');
        window.electron.store.set('promptContextFile', []);
        const newImageList: (string | ArrayBuffer | null)[] = [];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < files.length; i++) {
          const reader: any = new FileReader();
          reader.onload = () => {
            const base64Image = reader.result.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix
            newImageList.push(base64Image);
            if (newImageList.length === files.length) {
              setImageList([...imageList, ...newImageList]);
              // onDrop([...imageList, ...newImageList]);
              // console.log([...imageList, ...newImageList]);
              window.electron.store.set('promptImages', [
                ...imageList,
                ...newImageList,
              ]);
            }
          };
          reader.readAsDataURL(files[i]);
        }
      }
      if (fileType.includes('pdf')) {
        setImageList([]);
        window.electron.store.set('promptImages', []);
        setContextType('pdf');
        const newFilePaths = [...filePaths, file.path];
        const deDupedFilePaths = Array.from(new Set(newFilePaths));
        setFilePaths(deDupedFilePaths);
        window.electron.store.set('promptContextFile', [file.path]);
      }
      // else {
      //   // empty image list
      //   setImageList([]);
      //   window.electron.store.set('promptImages', []);
      // }
    }
  };

  return (
    <Paper
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '250px',
        // padding: '15px',
        border: '2px dashed #aaa',
        backgroundColor: isDraggingOver ? 'lightblue' : 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
      }}
      elevation={3}
    >
      <Box
        sx={{
          width: '100%',
          height: '250px',
          backgroundImage: `url(${Logo})`,
          backgroundSize: 'cover',
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
          opacity: 0.1,
          display: 'flex',
          position: 'absolute',
        }}
      />
      <Box
        style={{
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" component="h6">
          {t('Context Window')}
        </Typography>
        {/* {JSON.stringify(filePaths)} */}
        {filePaths &&
          filePaths.length > 0 &&
          filePaths.map((filePath, index) => (
            <Button
              title={`${t('Remove')}: ${filePath}`}
              variant="contained"
              onClick={() => {
                removeFile(index);
              }}
            >
              <Typography>{`#${index + 1}`} </Typography>
              <DeleteOutline />
            </Button>
          ))}

        {imageList &&
          imageList.length > 0 &&
          imageList.map((image, index) => (
            <Button
              variant="contained"
              title="Remove"
              onClick={() => {
                removeImage(index);
              }}
            >
              <img
                // eslint-disable-next-line react/no-array-index-key
                key={index + 1}
                src={`data:image/jpeg;base64,${image}`}
                alt="dropped"
                style={{ width: 'auto', height: '50px' }}
              />
            </Button>
          ))}
        {contextType && (
          <Typography sx={{ fontSize: 9 }}>
            {contextType === 'empty' ? t('Drag & Drop') : contextType}
          </Typography>
        )}
        {window.electron.store.get('llmModel') &&
          !window.electron.store.get('llmModel').includes('llava') &&
          contextType === 'image' &&
          imageList.length > 0 && (
            <Typography sx={{ fontSize: 9 }} color="red">
              {t('Incompatible model for image context')}
            </Typography>
          )}
      </Box>
    </Paper>
  );
}

export default ContextInputArea;
