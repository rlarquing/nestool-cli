const destino=` @ManyToMany((type) => $nameEntity, ($name) => $name.$atributo)
  @JoinColumn()`;
const origen=`
@ManyToMany((type) => $nameEntity, ($name) => $name.$atributos,{eager: false})
@JoinTable({name: '$name_$entidad',
    joinColumn: {
        name: "$name_id",
        referencedColumnName: "id"
    },
    inverseJoinColumn: {
        name: "$entidad_id",
        referencedColumnName: "id"
    }})`;
module.exports={origen,destino}