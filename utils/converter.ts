/**
 * Converts WebVTT content string to SubRip (SRT) format.
 */
export const convertVttToSrt = (vttContent: string): string => {
  // 1. Normalize line endings
  const normalized = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Split into blocks
  const blocks = normalized.split('\n\n');

  let srtOutput = '';
  let counter = 1;

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    
    // Skip empty blocks or the file header (WEBVTT)
    if (!trimmedBlock || trimmedBlock.startsWith('WEBVTT') || trimmedBlock.startsWith('NOTE')) {
      continue;
    }

    const lines = trimmedBlock.split('\n');
    let timeLineIndex = -1;

    // Find the line with the timestamp arrow -->
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIndex = i;
        break;
      }
    }

    // If no timestamp found, skip this block (it might be metadata or comments)
    if (timeLineIndex === -1) {
      continue;
    }

    // Extract timestamp line
    let timeLine = lines[timeLineIndex];
    
    // VTT uses '.' for milliseconds, SRT uses ','
    // Regex matches HH:MM:SS.mmm or MM:SS.mmm
    // We replace the dot before the last 3 digits with a comma
    timeLine = timeLine.replace(/(\d{2}:\d{2}\.\d{3})/g, (match) => match.replace('.', ','));
    timeLine = timeLine.replace(/(\d{2}:\d{2}:\d{2}\.\d{3})/g, (match) => match.replace('.', ','));
    
    // Remove VTT positioning/align settings (everything after the second timestamp)
    // e.g., 00:00:05.000 --> 00:00:10.000 align:start size:50%
    timeLine = timeLine.replace(/( --> \d{2}:\d{2}:\d{2},\d{3}).*/, '$1');
    timeLine = timeLine.replace(/( --> \d{2}:\d{2},\d{3}).*/, '$1'); // Handle short timestamp format

    // Get the subtitle text (lines after timestamp)
    const textLines = lines.slice(timeLineIndex + 1);
    
    // Clean up text tags if necessary (optional, but <v> tags are common in VTT)
    const cleanTextLines = textLines.map(line => 
      line.replace(/<[^>]*>/g, '') // Basic HTML tag stripping (like <b>, <i>, <v Voice>)
    );

    if (cleanTextLines.length > 0) {
      srtOutput += `${counter}\n`;
      srtOutput += `${timeLine}\n`;
      srtOutput += `${cleanTextLines.join('\n')}\n\n`;
      counter++;
    }
  }

  return srtOutput.trim();
};