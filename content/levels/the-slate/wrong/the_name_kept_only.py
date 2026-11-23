class Fox(Familiar):
    def __init__(self, name, color):
        self.name = name
        color = color

pimu = Fox("Pimu", "red")
kesi = Fox("Kesi", "white")
wizard.cast("minka", pimu)
wizard.cast("minka", kesi)
