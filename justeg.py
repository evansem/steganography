#justeg.py
#garphic interface that manages the encrypt and decrypt a message hidden inside the colour channels of a pbm image

#Developed by Emanuel Evans
#released: 14/9/18 

from tkinter import *
from tkinter.scrolledtext import * 
from tkinter import filedialog
from tkinter import messagebox
import config
import encoder


class Justeg:
    def __init__(self, root):
        '''creates all the widgets of the gui except for the PhotoImage due to errors they have been decleared outside this function'''
        self.frames = []
        #add more items in this list to have more frames (pages) in your interface
        self.frames_name = ["menu", "encryption", "decryption"]
        self.page = IntVar()
        #initialise the width of the photoimage, this needs to be different from zero even though img not grid yet
        self.width = 1
        self.page.set(0)

        self.skip = config.pbm["prefix"]
        
        #creates frames and widgets present across all pages
        for key in self.frames_name:
            self.frames.append(LabelFrame(root, text=key, bg="#f4F7FF")) #background colour
            self.error_label=Label(self.frames[self.frames_name.index(key)], text="error", anchor=CENTER, bg="#ffb800", fg="#fff", font=("Calibri", "11", "bold italic"))
            
            self.button_back = Button(self.frames[self.frames_name.index(key)], text="Return Home", command= lambda: self.change_page(0)) #pass self.page-1 to go back instead of home page in case more frames are added
            self.button_quit = Button(self.frames[self.frames_name.index(key)], text="Quit", command=self.ask_quit, bg="#FF2621", fg="#fff") #command=root.destroy to not have popup

            #home/back button position
            if key != "menu":
                self.button_back.grid(row=3, column=0, sticky=N+W)
                self.button_quit.grid(row=3, column=1, sticky=N+E)
            else:
                self.button_quit.grid(row=5, column=1)
            
        #use pack for frames so always at the center
        self.frames[0].pack(anchor=CENTER, expand=TRUE)

        #menu frame_______________note: frames[self.frames_name.index("menu")] = frame[0]_______________#

        self.button_encry = Button(self.frames[self.frames_name.index("menu")], text="Encryption (Select File)", command=lambda:self.select_file("encryption"), width=50, height= 4, anchor=CENTER, bg="#FF980A", fg="#fff", font=("Calibri", "18", "bold"))
        self.button_encry.grid(row=0, column=0, columnspan = 3, padx= 120, pady=30) 
        self.button_decry = Button(self.frames[self.frames_name.index("menu")], text="Decryption (Select File)", command=lambda:self.select_file("decryption"), width=50, height= 4, anchor=CENTER, bg="#812BB2", fg="#fff", font=("Calibri", "18", "bold"))
        self.button_decry.grid(row=1, column=0, columnspan = 3, sticky = N+S, padx= 120, pady=30)

                
        #encryption frame_______________Enter and Encrypt Message_______________#
        #labels
        self._num_label = Label(self.frames[self.frames_name.index("encryption")], text="Enter Message:", bg="#f4F7FF")
        self._img_original = Label(self.frames[self.frames_name.index("encryption")], text="Original Image:", bg="#f4F7FF")
        self._img_en = Label(self.frames[self.frames_name.index("encryption")], text="Encrypted Image:", bg="#f4F7FF") 
        #interaction widgets
        self.inputbox= ScrolledText(self.frames[self.frames_name.index("encryption")], width = 40, height = 10, state="normal", wrap = 'word')
        self.submit= Button(self.frames[self.frames_name.index("encryption")], width=30, anchor=CENTER, text="Save message in a new image", bg="#FF980A", fg="#fff", font=("Calibri", "13", "bold"), command=self.encrypt) #80bfff
        self.result_label = Label(self.frames[self.frames_name.index("encryption")], anchor=CENTER, bg="#009", fg="#fff", font=("Calibri", "11", "bold italic"))

        #layout
        self._num_label.grid(row= 0, column = 0)
        self.inputbox.grid(row= 1, column =0, columnspan=2, padx=2, pady=10)
        self.submit.grid(row=2, column = 0, columnspan=2, sticky=W+E, padx= 150, pady=10)


        #decryption frame_______________Show image and message_______________#
        self.submit_decry= Button(self.frames[self.frames_name.index("decryption")], width=20, anchor=CENTER, text="Get Message", bg="#812BB2", fg="#fff", font=("Calibri", "13", "bold"), command=self.show_decryption)
        self.message_label= ScrolledText(self.frames[self.frames_name.index("decryption")], width = 50, height = 10, state="disabled", wrap = 'word')
        
        self.submit_decry.grid(row=1, column = 0, sticky=W+E, padx= 20, pady=10)
        self.message_label.grid(row=2, column = 0, sticky=W+E, padx= 20, pady=10)

    def clear(self):
        '''Clear the decoded message found in the image from the screen '''
        self.message_label.configure(state='normal')
        self.message_label.delete('1.0', END)
        self.message_label.configure(state='disabled')

     
    def change_page(self, key):
        '''let the user change the labelframe which is currently looking at'''
        if self.page.get() == self.frames_name.index("decryption"):
            self.clear()
            self.submit_decry.configure(state= 'normal')

        #delete the preview of the encrypted image and eventual feedback labels
        elif self.page.get() == self.frames_name.index("encryption"):
            self.submit.configure(state= 'normal')
            try:
                self.img_label2.grid_forget()
                self._img_en.grid_forget()
            except AttributeError:
                #in case user go back before encryption
                pass

        try:
            self.result_label.grid_forget()
        except AttributeError:
            #in case user go back before encryption
            pass
            
        if key < len(self.frames) and key >= 0: #check that no major error happend with the index of the page
            #if is reasonable change page to the one requiested
            self.frames[self.page.get()].grid_forget()
            self.frames[self.page.get()].forget()
            self.page.set(key)
            self.frames[self.page.get()].pack(anchor=CENTER, expand=TRUE) 

    def select_file(self, next_frame):
        '''manage the interaction between the user and the image directory to select a pbm image'''
        keep = True
        while keep:
            try:
                self.filename =  filedialog.askopenfilename(initialdir = "\img",title = "Select file",filetypes = (("pbm files","*.pbm"),)) #filetypes = (("jpeg files","*.jpg"),("all files","*.*"))
                self.img= PhotoImage(file =self.filename)
                #resize iamge to dispaly, both zoom and subsample were needed as proved by testing
                self.scale_w = int(self.img.height()/180)*2
                self.img = self.img.zoom(2)
                if self.scale_w > 0 : self.img = self.img.subsample(self.scale_w)

                #during testing I had problems if this was in the __init__
                self.img_label = Label(self.frames[self.frames_name.index(next_frame)], image=self.img)
                self.img_label.grid(row=1, column = 2, rowspan=2, sticky="N")
                self._img_original.grid(row=0, column = 2)
                
                if self.filename == '':
                    #in case the file log is closed without selecting an image
                    keep = False
                else:
                    keep = False
                    self.change_page(self.frames_name.index(next_frame))
                    #note that file log have .pbm as required format therefore the user is not allowed to select anything else
                    #so no further error prevention is needed
            except IOError as e:
                #In case file not found a popup message is already sent by the interface, this is to have more info about the essor
                print("Couldn't open the file {}".format(self.filename))
            

    def open_in_bin(self, image):
        '''given a pbm image creates a list with its colour values and a variable which holds the length of its header'''
        file = open(image, "rb")
    
        lines = file.read()
        #needed because sometimes bytearray express with b"...." and other times as b'....'
        raw = str(lines).replace("b'","").replace('b"',"").split("\\n")
        self.width=raw[1]
        self.height=raw[2]
        header=raw[:4]

        for h in header:
            self.skip += len(str(h))
                        
        channels =[] #because lines not usable as list
        for line in lines:
            channels.append("{0:08b}".format(line))

        file.close()
        return channels
    
    def encrypt(self):
        '''given the colour channels and a number of ASCII character changes the lats 2 digits channels values with the binary value of the text'''
        if all(ord(char) < 128 for char in self.inputbox.get('1.0', END)):
            #open image
            channels = self.open_in_bin(self.filename)
            #convert input message into binary
            bin_txt=''
            for letter in self.inputbox.get('1.0', END):
                bin_txt += format(ord(letter), '07b') #each character will be express in 7 bits ASCII code

            """append the end of transimition character, note that as the message in binary is
            encrypted and read 2 at the time is the tot num of digits is odd the program chould skip the sign as proved by testing"""
            if len(bin_txt) % 2 == 0:
                 bin_txt += '00000100' #if the lenth is even add 8 bits
            else:
                bin_txt += '0000100' #end of transmittion

            if len(bin_txt) <= 2*(len(channels)-self.skip):
                """tot number of bits in txt less or equal than number of channels in the image excluding first 12 (header info)
                times 2 because we are changing the 2 least significant bits for each colour channel"""

                #start at 11 to skip the header info
                for i in range(self.skip,len(channels)):
                    if bin_txt != "":
                        #print(channels[i], end=" --> ")
                        channels[i]=channels[i][:-2]+str(bin_txt[:2]) #last 2 bit of channel changed with first 2 of bin_text
                        #print(channels[i])
                        bin_txt = bin_txt[2:]
                    else:
                        break
            else:
                self.error_label.configure(text="{} characters entered, only {} allowed".format(len(bin_txt), 2*(len(channels)-20)))
                self.error_label.grid(row=0, column=0, sticky=W+E, columnspan=2, padx=10)

            #print(channels)#see the difference now that every 3 items is zero
            for i in range(len(channels)):
                channels[i] = int(channels[i], 2) #transform in dec for bytearray
            #translate back to byte
            byte_img = bytearray(channels)
            #print(byte_img)

            #while copy_file != ''
            #try:
            copy_filename =  filedialog.asksaveasfilename(initialdir = "\img",title = "Save Encrypted image", defaultextension=".pbm", filetypes = (("pbm files","*.pbm"),))

            copy_file = open(copy_filename, 'wb')
            copy_file.write(byte_img)
            copy_file.close()

            #encryption frame_______________Image_______________#
            self.img2 = PhotoImage(file = copy_filename) #test3.pbm
            self.img2 = self.img2.zoom(2) #with 250, I ended up running out of memory
            if self.scale_w > 0 : self.img2 = self.img2.subsample(self.scale_w)
            #self.img2 = self.img2.subsample(10)
            self.img_label2 = Label(self.frames[self.frames_name.index("encryption")], image=self.img2)
            self._img_en.grid(row=3, column = 2)
            self.img_label2.grid(row=4, column = 2) #, padx= 2, pady=2

            #clear the entry box and display that message have been ecrypted
            self.inputbox.delete("0.0", END)
            self.result_label.configure(text="message encrypted successfully", bg="#FF980A")
            self.submit.configure(state= 'disabled') #no possible to click button after decryption
        else:
            self.result_label.configure(text="enter ASCII code only", bg="#d00")

        self.result_label.grid(row=1, column = 0, columnspan=2, sticky=W+E, padx=120, pady=10)

    def show_decryption(self):
        channels = self.open_in_bin(self.filename)
        text = encoder.decryption(channels)

        self.clear()
        self.message_label.configure(state='normal')
        self.message_label.insert(END, text)
        self.message_label.configure(state='disabled')
        self.submit_decry.configure(state='disabled')  # no possible to click button after decryption


    def ask_quit(self):
        '''popup when user click quit, red button'''
        if messagebox.askokcancel("Quit", "Do you want to quit?"):
            root.destroy()

            
        
if __name__ == '__main__':
    root = Tk()
    root.geometry("1100x720+20+0")
    root.title("justeg")
    root.configure(background="#f4F7FF")
    interface = Justeg(root)
    root.mainloop()
     

