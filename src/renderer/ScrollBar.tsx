const customScrollBar = (props: { primary?: string; secondary?: string }) => {
  const { primary, secondary } = props;
  return {
    // scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: '0.5em',
    },
    '&::-webkit-scrollbar-track': {
      background: secondary,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: primary,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555',
    },
  };
};

export default customScrollBar;
