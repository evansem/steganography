# Steganography

A cool little project to encode messages inside images, this program is also known as **Justeg**.

This name comes from the concept of this project, just a simple **steg**anography software.
Moreover, I like the name because it somewhat resembles Easter eggs which are feature that 
developers hide in their programs as a joke. This links to a common usage of this program 
as it could be easily be used to hide funny messages in websites' pavicon.

## Disclaimer
This is not a secure cryptography algorithm due to the absence of a secret key indeed 
whoever has a copy of the code or knows how the algorithm work can decrypt the message.
The main strength of this algorithm is that when it adds messages to an image it will
still look the same as the difference is hard to notice by eye.
So it is just a funny way to hide messages in unexpected places, aka images.


## Virgil the guide through justeg's inferno

This program only allows to encrypt ASCII characters.

## encryption
1. click Encryption in the menu frame
2. the code will automatically open the file dialog to select a file that will be
   changed to include the messge inside, this file can be anywhere in your directory 
   including different disks, as long as they are .pbm format.Note that the program 
   will open as default the folder where the program is located and where there 
   should be a folder called img with some trial images
3. one selected the .pbm image you will be showed the encryption frame where you have
   an entrybox to type your message to encrypt, note that is a scolldawn so that you
   easly read over you message even though it contains several paragraphs
4. when you are feeling confident with what you have write press the button 
   'save message in a new image'
5. the code will automatically open the file dialog to let you choose the name of the
   new file that will contain the message and where you will like to save it
 


## decryption
1. click Decryption in the menu frame
2. the code will automatically open the file dialog to select a file that will open 
   to decrypt the message
3. click 'get message' and the message will be showed in the box below
4. use the bar on the right to scoll up and down to read the message as many times as you like
   note that is you go back to the home page or you quit the program the message will be deleted
   from the screen but it will still be inside the image


##delete encrypted message
to delete the message inside the image you can either delete the .pbm image or overwrite a new message

