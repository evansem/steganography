# justeg.py
# A graphic interface that manages the encrypt and decrypt a message hidden inside the colour channels of a pbm image

# Developed by Emanuel Evans
# first released: 14/9/18
# reviewed on: 13/3/22

from tkinter import *
from tkinter.scrolledtext import *
from tkinter import filedialog
from tkinter import messagebox

import config
import encoder
from imgcanvas import ImgCanvas


class JustegGui:
    def __init__(self, root):
        """
        creates all the widgets of the gui except for the PhotoImage due to errors they have been declared outside this function
        """
        self.frames = []
        # add more items in this list to have more frames (pages) in your interface
        self.frames_name = ["menu", "encryption", "decryption"]
        self.page = IntVar()
        # initialise the width of the photoimage, this needs to be different from zero even though the image is not grid yet
        # self.width = 1
        self.page.set(0)
        self.bg_col = config.colours["background"]
        # creates frames and widgets present across all pages
        for key in self.frames_name:
            self.frames.append(LabelFrame(root, text=key, bg=self.bg_col,
                                          font=("Calibri", "15", "italic")))

            self.error_label = Label(self.frames[self.frames_name.index(key)], text="error", anchor=CENTER,
                                     bg="#ffb800", fg="#fff", font=("Calibri", "11", "bold italic"))

            self.button_back = Button(self.frames[self.frames_name.index(key)], text="Return Home",
                                      command=lambda: self.change_page(
                                          0))  # pass self.page-1 to go back instead of home page in case more frames are added

            # home/back button position
            if key != "menu":
                self.button_back.grid(row=3, column=0, sticky=N + W)

        # use pack for frames so always at the center
        self.frames[0].pack(anchor=CENTER, expand=TRUE)

        # menu frame_______________note: frames[self.frames_name.index("menu")] = frame[0]_______________#

        self.button_encry = Button(self.frames[self.frames_name.index("menu")], text="Encryption (Select File)",
                                   command=lambda: self.select_file("encryption"),
                                   width=50, height=4, anchor=CENTER,
                                   bg=config.colours["encrypt_btn"], fg="#fff",
                                   font=("Calibri", "18", "bold"))
        self.button_encry.grid(row=0, column=0, columnspan=3, padx=120, pady=30)
        self.button_decry = Button(self.frames[self.frames_name.index("menu")], text="Decryption (Select File)",
                                   command=lambda: self.select_file("decryption"),
                                   width=50, height=4, anchor=CENTER,
                                   bg=config.colours["decrypt_btn"], fg="#fff",
                                   font=("Calibri", "18", "bold"))
        self.button_decry.grid(row=1, column=0, columnspan=3, sticky=N + S, padx=120, pady=30)

        # encryption frame_______________Enter and Encrypt Message_______________#
        # labels
        self._num_label = Label(self.frames[self.frames_name.index("encryption")],
                                text="Enter Message:", bg=self.bg_col)

        self._img_original = Label(self.frames[self.frames_name.index("encryption")],
                                   text="Original Image:", bg=self.bg_col)

        self._img_en = Label(self.frames[self.frames_name.index("encryption")],
                             text="Encrypted Image:", bg=self.bg_col)
        # interaction widgets
        self.inputbox = ScrolledText(self.frames[self.frames_name.index("encryption")],
                                     width=40, height=10, state="normal", wrap='word')

        self.submit = Button(self.frames[self.frames_name.index("encryption")], width=30, anchor=CENTER,
                             text="Save message in a new image",
                             bg=config.colours["encrypt_btn"], fg="#fff",
                             font=("Calibri", "13", "bold"), command=self.show_encrypt)  # 80bfff

        self.result_label = Label(self.frames[self.frames_name.index("encryption")], anchor=CENTER, bg="#009",
                                  fg="#fff", font=("Calibri", "11", "bold italic"))

        # layout
        self._num_label.grid(row=0, column=0)
        self.inputbox.grid(row=1, column=0, columnspan=2, padx=2, pady=10)
        self.submit.grid(row=2, column=0, columnspan=2, sticky=W + E, padx=150, pady=10)

        # decryption frame_______________Show image and message_______________#
        self.submit_decry = Button(self.frames[self.frames_name.index("decryption")], width=20, anchor=CENTER,
                                   text="Get Message",
                                   bg=config.colours["decrypt_btn"], fg="#fff",
                                   font=("Calibri", "13", "bold"),
                                   command=self.show_decryption)

        self.message_label = ScrolledText(self.frames[self.frames_name.index("decryption")], width=50, height=10,
                                          state="disabled", wrap='word')

        self.submit_decry.grid(row=1, column=0, sticky=W + E, padx=20, pady=10)
        self.message_label.grid(row=2, column=0, sticky=W + E, padx=20, pady=10)

    def clear(self):
        '''Clear the decoded message found in the image from the screen '''
        self.message_label.configure(state='normal')
        self.message_label.delete('1.0', END)
        self.message_label.configure(state='disabled')

    def change_page(self, key):
        """let the user change the labelframe which is currently looking at"""
        if self.page.get() == self.frames_name.index("decryption"):
            self.clear()
            self.submit_decry.configure(state='normal')

        # delete the preview of the encrypted image and eventual feedback labels
        elif self.page.get() == self.frames_name.index("encryption"):
            self.submit.configure(state='normal')
            try:
                self.img_label2.grid_forget()
                self._img_en.grid_forget()
            except AttributeError:
                # in case user go back before encryption
                pass

        try:
            self.result_label.grid_forget()
        except AttributeError:
            # in case user go back before encryption
            pass

        if key < len(self.frames) and key >= 0:  # check that no major error happend with the index of the page
            # if is reasonable change page to the one requiested
            self.frames[self.page.get()].grid_forget()
            self.frames[self.page.get()].forget()
            self.page.set(key)
            self.frames[self.page.get()].pack(anchor=CENTER, expand=TRUE)

    def select_file(self, next_frame):
        """
        manage the interaction between the user and the image directory to select a pbm image
        """
        try:
            filename = filedialog.askopenfilename(initialdir="\img", title="Select file",
                                                  filetypes=(("pbm files", "*.pbm"),))
            # note that file log have .pbm as required format therefore the user is not allowed to select anything else
            # so no further error prevention is needed

            if (filename != ''):
                self.img_canvas = ImgCanvas(filename)
                self.display_img(self.img_canvas, next_frame)
                self.change_page(self.frames_name.index(next_frame))

        except IOError as e:
            # In case file not found a popup message is already sent by the interface, this logs the error
            print("Couldn't open the file {}".format(filename))

    def display_img(self, image, next_frame):

        self.img = PhotoImage(file=image.filename)

        # resize image to dispaly, both zoom and subsample are needed
        self.scale_w = int(self.img.height() / 180) * 2
        self.img = self.img.zoom(2)
        if self.scale_w > 0: self.img = self.img.subsample(self.scale_w)

        # problems occurred if placed in __init__
        self.img_label = Label(self.frames[self.frames_name.index(next_frame)], image=self.img)
        self.img_label.grid(row=1, column=2, rowspan=2, sticky="N")
        self._img_original.grid(row=0, column=2)

    def show_encrypt(self):
        text_to_encrypt = self.inputbox.get('1.0', END)

        # Check that only valid characters have been entered
        if not (all(ord(char) < 128 for char in text_to_encrypt)):
            self.result_label.configure(text="enter ASCII code only", bg="#d00")
            return

        # Include message in the image
        byte_img = encoder.encrypt(self.img_canvas, text_to_encrypt, self.error_label)

        # Save the new image
        copy_filename = filedialog.asksaveasfilename(initialdir="\img", title="Save Encrypted image",
                                                     defaultextension=".pbm", filetypes=(("pbm files", "*.pbm"),))

        copy_file = open(copy_filename, 'wb')
        copy_file.write(byte_img)
        copy_file.close()

        # encryption frame_______________Image_______________#
        self.img2 = PhotoImage(file=copy_filename)  # test3.pbm
        self.img2 = self.img2.zoom(2)  # with 250, I ended up running out of memory
        if self.scale_w > 0: self.img2 = self.img2.subsample(self.scale_w)
        # self.img2 = self.img2.subsample(10)
        self.img_label2 = Label(self.frames[self.frames_name.index("encryption")], image=self.img2)
        self._img_en.grid(row=3, column=2)
        self.img_label2.grid(row=4, column=2)  # , padx= 2, pady=2

        # Clear the entry box and confirm that message have been encrypted
        self.inputbox.delete("0.0", END)
        self.result_label.configure(text="message encrypted successfully",
                                    bg=config.colours["encrypt_btn"])
        # Prevent the button to be clicked again after the operation have been performed
        self.submit.configure(state='disabled')

        self.result_label.grid(row=1, column=0, columnspan=2, sticky=W + E, padx=120, pady=10)

    def show_decryption(self):
        text = encoder.decryption(self.img_canvas)

        self.clear()
        self.message_label.configure(state='normal')
        self.message_label.insert(END, text)
        self.message_label.configure(state='disabled')
        self.submit_decry.configure(state='disabled')  # no possible to click button after decryption


if __name__ == '__main__':
    root = Tk()
    root.geometry("1100x720+20+0")
    root.title("justeg")
    root.configure(background=config.colours["background"])
    interface = JustegGui(root)
    root.mainloop()
