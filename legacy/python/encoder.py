# encoder.py

# Developed by Emanuel Evans
# first released: 13/3/22


def encrypt(img_canvas, text, error_label):
    '''given the colour channels and a number of ASCII character changes the lats 2 digits channels values with the binary value of the text'''

    # open image
    channels = img_canvas.get_bin_channels()
    # convert input message into binary
    bin_txt = ''
    for letter in text:
        bin_txt += format(ord(letter), '07b')  # each character will be express in 7 bits ASCII code

    """append the end of transimition character, note that as the message in binary is
    encrypted and read 2 at the time is the tot num of digits is odd the program chould skip the sign as proved by testing"""
    if len(bin_txt) % 2 == 0:
        bin_txt += '00000100'  # if the lenth is even add 8 bits
    else:
        bin_txt += '0000100'  # end of transmittion

    if len(bin_txt) <= 2 * (len(channels) - img_canvas.prefix):
        """tot number of bits in txt less or equal than number of channels in the image excluding first 12 (header info)
        times 2 because we are changing the 2 least significant bits for each colour channel"""

        # start at 11 to skip the header info
        for i in range(img_canvas.prefix, len(channels)):
            if bin_txt != "":
                # print(channels[i], end=" --> ")
                channels[i] = channels[i][:-2] + str(
                    bin_txt[:2])  # last 2 bit of channel changed with first 2 of bin_text
                # print(channels[i])
                bin_txt = bin_txt[2:]
            else:
                break
    else:
        error_label.configure(
            text="{} characters entered, only {} allowed".format(len(bin_txt), 2 * (len(channels) - 20)))
        error_label.grid(row=0, column=0, sticky=W + E, columnspan=2, padx=10)

    # print(channels)#see the difference now that every 3 items is zero
    for i in range(len(channels)):
        channels[i] = int(channels[i], 2)  # transform in dec for bytearray
    # translate back to byte
    return bytearray(channels)


def has_message_terminated(bin_txt):
    """
    Look out for the end of transmission character
    :param bin_text: the image binary stream
    :return: all the encoded message has been read
    """
    # in case of error 0000010 is start transmission which is still a character not used
    return bin_txt[:7] == '0000100' or bin_txt[:8] == '00000100'


def decryption(img_canvas):
    """
    Extract the list of colour channels from an image,
    Then it reads the last 2 of each channel and translate them in characters using ASCII
    :param img_canvas: custom img wrapper
    """
    channels = img_canvas.get_bin_channels()

    bin_txt = ''
    text = ''

    for i in range(img_canvas.prefix, len(channels)):
        # print(channels[i], end="*")
        bin_txt += channels[i][-2:]

    while not has_message_terminated(bin_txt):
        text += chr(int('0' + bin_txt[:7], 2))
        bin_txt = bin_txt[7:]

    return text
