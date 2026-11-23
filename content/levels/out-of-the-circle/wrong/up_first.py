class Fox(Familiar):
    def __init__(self, name, color):
        self.name = name
        self.color = color

pimu = Fox("Pimu", "red")
wizard.cast("minka", pimu)
pimu.move_up(5)
pimu.move_down(2)
pimu.move_left(4)
