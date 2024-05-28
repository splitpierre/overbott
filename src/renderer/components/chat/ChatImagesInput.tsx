/* eslint-disable react/no-array-index-key */
// DroppableArea.js
import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { AddCircleOutline, AddPhotoAlternate } from '@mui/icons-material';
import { t } from 'i18next';

export function DraggableItem({ children }) {
  const handleDragStart = (event: any) => {
    event.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };

  return (
    <Paper
      draggable
      onDragStart={handleDragStart}
      style={{
        padding: '16px',
        cursor: 'grab',
        marginBottom: '8px',
      }}
      elevation={3}
    >
      {children}
    </Paper>
  );
}

export function DroppableArea({ children }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [imageList, setImageList] = useState([]);

  const handleDragOver = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  const removeImage = (index: number) => {
    const newImageList = imageList.filter((_, i) => i !== index);
    setImageList(newImageList);
    window.electron.store.set('promptImages', newImageList);
  };

  const handleDrop = (event: any) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const { files } = event.dataTransfer;

    if (files.length > 0) {
      const newImageList: (string | ArrayBuffer | null)[] = [];
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
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
  };

  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          minHeight: '57px',
          padding: '1px',
          border: '2px dashed #aaa',
          backgroundColor: isDraggingOver ? 'lightblue' : 'transparent',
        }}
        elevation={0}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.3,
          }}
          // size="small"
          // color="primary"
          // aria-label="add"
          // onMouseDown={(e) => e.preventDefault()}
        >
          <AddPhotoAlternate style={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: 9 }}>{t('Drag & Drop')}</Typography>
        </div>
        <div>
          {imageList.map((image, index) => (
            <Button
              variant="contained"
              title="Remove"
              onClick={() => {
                removeImage(index);
              }}
            >
              <img
                key={index + 1}
                src={`data:image/jpeg;base64,${image}`}
                alt="dropped"
                style={{ width: 'auto', height: '50px' }}
              />
            </Button>
          ))}
        </div>
      </Paper>
    </div>
  );
}
