class Fox(Familiar):
    def __init__(self, name, color):
        self.name = name
        self.color = color

    def go_to(self):
        self.move_right(3)
        self.move_up(5)

pimu.go_to()
