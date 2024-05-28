import * as Lottie from '../lib/lottie-player';

function LottieCustomPlayer(props: {
  src: any;
  loop: boolean;
  autoplay: boolean;
  controls?: boolean;
}) {
  const { src, loop, autoplay, controls } = props;
  return (
    <>
      <script src={String(Lottie)} />
      <lottie-player
        src={src}
        loop={loop}
        autoplay={autoplay}
        background="transparent"
        speed="1"
        style={{ width: '300px', height: '300px' }}
        direction="1"
        mode="normal"
        controls={controls}
      />
    </>
  );
}

export default LottieCustomPlayer;
