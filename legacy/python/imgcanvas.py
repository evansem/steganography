#canvas.py

#Developed by Emanuel Evans
#first released: 13/3/22
import config

class ImgCanvas:
    """
    Store the information related to the image that will be used as a canvas
    """

    def __init__(self, _filename):
        self.filename = _filename
        self.prefix = config.pbm["prefix"]

    def get_bin_channels(self):
        """
        given a pbm image creates a list with its colour values and a variable which holds the length of its header
        """
        file = open(self.filename, "rb")

        lines = file.read()
        # needed because sometimes bytearray express with b"...." and other times as b'....'
        raw = str(lines).replace("b'", "").replace('b"', "").split("\\n")
        # self.width = raw[1]
        # self.height = raw[2]
        header = raw[:4]

        for h in header:
            self.prefix += len(str(h))

        channels = []  # because lines not usable as list
        for line in lines:
            channels.append("{0:08b}".format(line))

        file.close()
        return channels

    def increment_prefix(self, skip):
        """
        :param skip: how much should the prefix be incremented
        """
        self.prefix += skip