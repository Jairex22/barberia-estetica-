using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety.EditorTools
{
    // Distribución (metros, eje Z hacia el norte). Todas las áreas se conectan por un pasillo central en x = 0.
    //   Recepción        x[-6,6]   z[-12,-2]
    //   Acceso / EPP     x[-6,6]   z[-2,6]
    //   Logística/cruce  x[-16,16] z[6,18]   (ruta de montacargas z[12.5,15.5])
    //   Pasillo          x[-2.5,2.5] z[18,26]
    //   Producción       x[-12,12] z[26,40]
    //   Ensamble y QC    x[-12,12] z[40,52]
    //   Almacén          x[-10,10] z[52,66]  (salida este z[59,61], salida norte x[-1,1])
    //   Punto de reunión exterior en (16, 0, 66)
    internal static partial class FactorySceneGenerator
    {
        static readonly Color TextDark = new Color(0.08f, 0.08f, 0.1f);
        static readonly Color ZoneActivation = new Color(0.2f, 0.6f, 1f, 0.15f);
        static readonly Color ZoneDanger = new Color(1f, 0.2f, 0.1f, 0.2f);
        static readonly Color ZoneInfo = new Color(0.2f, 1f, 0.4f, 0.15f);

        // ------------------------------------------------------------------ Edificio

        static void BuildBuilding(Transform root)
        {
            var floors = Geo.Group("Pisos", root);
            Geo.Floor("Piso recepción", floors, -6f, 6f, -12f, -2f, "PisoRecepcion");
            Geo.Floor("Piso acceso", floors, -6f, 6f, -2f, 6f, "PisoRecepcion");
            Geo.Floor("Piso logística", floors, -16f, 16f, 6f, 18f, "Piso");
            Geo.Floor("Piso pasillo", floors, -2.5f, 2.5f, 18f, 26f, "Piso");
            Geo.Floor("Piso producción", floors, -12f, 12f, 26f, 40f, "Piso");
            Geo.Floor("Piso ensamble", floors, -12f, 12f, 40f, 52f, "Piso");
            Geo.Floor("Piso almacén", floors, -10f, 10f, 52f, 66f, "Piso");
            var outside = Geo.Box("Terreno exterior", floors, new Vector3(5f, -0.07f, 30f), new Vector3(90f, 0.1f, 140f), "Pasto", true, false);
            outside.AddComponent<TeleportSurface>();

            var walls = Geo.Group("Muros", root);
            Geo.WallAlongX("Muro sur recepción", walls, -12f, -6f, 6f);
            Geo.WallAlongZ("Muro oeste recepción/acceso", walls, -6f, -12f, 6f);
            Geo.WallAlongZ("Muro este recepción/acceso", walls, 6f, -12f, 6f);
            Geo.WallAlongX("Muro recepción-acceso", walls, -2f, -6f, 6f, new Vector2(-1.5f, 1.5f));
            Geo.WallAlongX("Muro de acceso a planta", walls, 6f, -16f, 16f, new Vector2(-1.5f, 1.5f));
            Geo.WallAlongZ("Muro oeste logística", walls, -16f, 6f, 18f);
            Geo.WallAlongZ("Muro este logística", walls, 16f, 6f, 18f);
            Geo.WallAlongX("Muro norte logística", walls, 18f, -16f, 16f, new Vector2(-2.5f, 2.5f));
            Geo.WallAlongZ("Muro oeste pasillo", walls, -2.5f, 18f, 26f);
            Geo.WallAlongZ("Muro este pasillo", walls, 2.5f, 18f, 26f);
            Geo.WallAlongX("Muro sur producción", walls, 26f, -12f, 12f, new Vector2(-2.5f, 2.5f));
            Geo.WallAlongZ("Muro oeste producción/ensamble", walls, -12f, 26f, 52f);
            Geo.WallAlongZ("Muro este producción/ensamble", walls, 12f, 26f, 52f);
            Geo.WallAlongX("Muro producción-ensamble", walls, 40f, -12f, 12f, new Vector2(-2f, 2f));
            Geo.WallAlongX("Muro ensamble-almacén", walls, 52f, -12f, 12f, new Vector2(-1.5f, 1.5f));
            Geo.WallAlongZ("Muro oeste almacén", walls, -10f, 52f, 66f);
            Geo.WallAlongZ("Muro este almacén", walls, 10f, 52f, 66f, new Vector2(59f, 61f));
            Geo.WallAlongX("Muro norte almacén", walls, 66f, -10f, 10f, new Vector2(-1f, 1f));

            var roofs = Geo.Group("Techos", root);
            Geo.Roof("Techo recepción y acceso", roofs, -6f, 6f, -12f, 6f);
            Geo.Roof("Techo logística", roofs, -16f, 16f, 6f, 18f);
            Geo.Roof("Techo pasillo", roofs, -2.5f, 2.5f, 18f, 26f);
            Geo.Roof("Techo producción y ensamble", roofs, -12f, 12f, 26f, 52f);
            Geo.Roof("Techo almacén", roofs, -10f, 10f, 52f, 66f);

            // Cerca perimetral del exterior (limita el área al salir durante el simulacro).
            var fence = Geo.Group("Cerca exterior", root);
            Geo.Box("Cerca este", fence, new Vector3(26f, 0.6f, 64f), new Vector3(0.1f, 1.2f, 24f), "Acero");
            Geo.Box("Cerca norte", fence, new Vector3(7f, 0.6f, 76f), new Vector3(38f, 1.2f, 0.1f), "Acero");
            Geo.Box("Cerca oeste", fence, new Vector3(-12f, 0.6f, 71f), new Vector3(0.1f, 1.2f, 10f), "Acero");
            Geo.Box("Cerca sur", fence, new Vector3(19f, 0.6f, 52f), new Vector3(14f, 1.2f, 0.1f), "Acero");

            // Árboles decorativos.
            var trees = Geo.Group("Árboles", root);
            foreach (var p in new[] { new Vector3(22f, 0f, 72f), new Vector3(-6f, 0f, 72f), new Vector3(24f, 0f, 56f), new Vector3(4f, 0f, 73f) })
            {
                Geo.Cylinder("Tronco", trees, p, 0.3f, 2f, "Madera");
                var crown = Geo.LocalSphere("Copa", trees, Vector3.zero, new Vector3(2.2f, 2.4f, 2.2f), "Planta");
                crown.transform.position = p + Vector3.up * 2.8f;
            }
        }

        // ------------------------------------------------------------------ A. Recepción y acceso

        static ScenarioBase BuildAreaA(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioAccess>();
            sc.scenarioId = "A";
            sc.category = HazardCategory.Safety;
            sc.playerStart = Geo.Point("Inicio del visitante A", root, new Vector3(0f, 0f, -10.2f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía A", root, new Vector3(1.8f, 0f, -6.6f), -90f);

            // Mobiliario de recepción.
            Geo.Box("Mostrador", root, new Vector3(-3f, 0.55f, -8f), new Vector3(3f, 1.1f, 0.8f), "Madera");
            Geo.Box("Cubierta del mostrador", root, new Vector3(-3f, 1.12f, -8f), new Vector3(3.1f, 0.05f, 0.9f), "Blanco");
            Geo.Person("Recepcionista", root, new Vector3(-3f, 0f, -8.9f), 0f, "CamisaVerde", false, null, "Recepción", "Piel1");
            Geo.Box("Banca", root, new Vector3(4.5f, 0.25f, -10.5f), new Vector3(2.2f, 0.5f, 0.6f), "Azul");
            var pot = Geo.Cylinder("Maceta", root, new Vector3(5.2f, 0f, -3f), 0.6f, 0.6f, "Carton");
            var plant = Geo.LocalSphere("Planta", root, Vector3.zero, new Vector3(0.9f, 1.1f, 0.9f), "Planta");
            plant.transform.position = pot.transform.position + Vector3.up * 0.8f;
            Geo.Sign("Letrero bienvenida", root, new Vector3(0f, 3.4f, -2.15f), Vector3.back,
                "ENSAMBLES DEMO (empresa ficticia)\nRecepción de visitantes", 5f, 0.9f, "ParedAcento", Color.white, 46);
            Geo.Sign("Letrero aviso", root, new Vector3(5.85f, 2.2f, -7f), Vector3.left,
                "Visitantes: no operan equipos ni realizan tareas.\nAnte cualquier duda, pregunte al guía.", 3.2f, 0.9f, "Blanco", TextDark, 30);

            // Tablero de reglas (interactivo).
            var board = Geo.Group("Tablero de reglas", root);
            board.position = new Vector3(-5.82f, 1.6f, -6f);
            Geo.LocalBox("Placa", board, Vector3.zero, new Vector3(0.08f, 1.5f, 2.3f), "Blanco");
            Geo.WorldText("Texto", board, new Vector3(0.05f, 0f, 0f), Quaternion.Euler(0f, -90f, 0f),
                "REGLAS PARA VISITANTES\n\n1. Inducción antes de ingresar\n2. EPP obligatorio\n3. Pasillos peatonales\n4. No tocar equipos\n5. Reportar y preguntar",
                34, TextDark, new Vector2(2.2f / 0.004f, 1.45f / 0.004f), 0.004f);
            sc.rulesBoard = Geo.MakeInteractable(board.gameObject, "Revisar reglas para visitantes", board.position + new Vector3(0.5f, 1.05f, 0f), new Vector3(0.3f, 1.5f, 2.3f));

            // Estación de EPP.
            Geo.Box("Mesa de EPP", root, new Vector3(5.3f, 0.45f, 2f), new Vector3(0.9f, 0.9f, 3.4f), "Acero");
            Geo.Sign("Letrero EPP", root, new Vector3(5.85f, 2.3f, 2f), Vector3.left,
                "ESTACIÓN DE EPP PARA VISITANTES\nChaleco · Lentes · Protección auditiva", 3.2f, 0.8f, "Amarillo", TextDark, 30);
            sc.ppeItems = new Interactable[3];
            sc.ppeNames = new[] { "Chaleco de alta visibilidad", "Lentes de seguridad", "Protección auditiva" };

            var vest = Geo.Group("EPP chaleco", root);
            vest.position = new Vector3(5.25f, 0.95f, 0.9f);
            Geo.LocalBox("Chaleco", vest, Vector3.zero, new Vector3(0.45f, 0.06f, 0.55f), "ChalecoAltaVis");
            Geo.LocalBox("Franja", vest, new Vector3(0f, 0.035f, 0f), new Vector3(0.46f, 0.01f, 0.06f), "Blanco");
            sc.ppeItems[0] = Geo.MakeInteractable(vest.gameObject, "Tomar chaleco de alta visibilidad", vest.position + Vector3.up * 0.6f, new Vector3(0.6f, 0.3f, 0.7f));

            var glasses = Geo.Group("EPP lentes", root);
            glasses.position = new Vector3(5.25f, 0.95f, 2f);
            Geo.LocalBox("Armazón", glasses, Vector3.zero, new Vector3(0.06f, 0.05f, 0.2f), "Negro");
            Geo.LocalBox("Mica izquierda", glasses, new Vector3(-0.02f, 0f, -0.05f), new Vector3(0.02f, 0.05f, 0.08f), "Vidrio");
            Geo.LocalBox("Mica derecha", glasses, new Vector3(-0.02f, 0f, 0.05f), new Vector3(0.02f, 0.05f, 0.08f), "Vidrio");
            sc.ppeItems[1] = Geo.MakeInteractable(glasses.gameObject, "Tomar lentes de seguridad", glasses.position + Vector3.up * 0.6f, new Vector3(0.5f, 0.3f, 0.5f));

            var ears = Geo.Group("EPP protección auditiva", root);
            ears.position = new Vector3(5.25f, 0.98f, 3.1f);
            Geo.LocalCylinder("Concha izquierda", ears, new Vector3(0f, 0f, -0.09f), 0.1f, 0.06f, "Rojo");
            Geo.LocalCylinder("Concha derecha", ears, new Vector3(0f, 0f, 0.09f), 0.1f, 0.06f, "Rojo");
            Geo.LocalBox("Diadema", ears, new Vector3(0f, 0.06f, 0f), new Vector3(0.03f, 0.03f, 0.22f), "Negro");
            sc.ppeItems[2] = Geo.MakeInteractable(ears.gameObject, "Tomar protección auditiva", ears.position + Vector3.up * 0.6f, new Vector3(0.5f, 0.3f, 0.5f));

            // Puerta de acceso a planta (corrediza) con luz y letrero.
            var gate = Geo.Group("Puerta de acceso", root);
            gate.position = new Vector3(0f, 0f, 6f);
            var panel = Geo.LocalBox("Hoja corrediza", gate, new Vector3(0f, 1.3f, 0f), new Vector3(3f, 2.6f, 0.12f), "Maquina", true);
            sc.gatePanel = panel.transform;
            sc.gateClosedLocal = new Vector3(0f, 1.3f, 0f);
            sc.gateOpenLocal = new Vector3(3.05f, 1.3f, 0f);
            sc.gateLamp = Geo.Lamp("Luz de acceso", root, new Vector3(-1.9f, 2.6f, 5.82f), 0.22f, false, Color.red);
            var gateSign = Geo.Sign("Letrero acceso", root, new Vector3(0f, 3.4f, 5.85f), Vector3.back, "ACCESO A PLANTA", 3.6f, 0.9f, "Blanco", TextDark, 34);
            sc.gateSignText = gateSign;
            Geo.Cylinder("Poste torniquete izquierdo", root, new Vector3(-1.7f, 0f, 5.4f), 0.12f, 1.1f, "Acero");
            Geo.Cylinder("Poste torniquete derecho", root, new Vector3(1.7f, 0f, 5.4f), 0.12f, 1.1f, "Acero");
            sc.gateZone = Geo.Zone("Zona puerta de acceso", root, new Vector3(0f, 0f, 4.9f), new Vector3(3f, 3f, 2f), ZoneDanger);
            return sc;
        }

        // ------------------------------------------------------------------ B. Cruce de montacargas

        static ScenarioBase BuildAreaB(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioForklift>();
            sc.scenarioId = "B";
            sc.playerStart = Geo.Point("Inicio del visitante B", root, new Vector3(0f, 0f, 7.2f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía B", root, new Vector3(-0.95f, 0f, 11.4f), 0f);
            sc.activationZone = Geo.Zone("Activación B", root, new Vector3(0f, 0f, 9.4f), new Vector3(32f, 3f, 6.2f), ZoneActivation);

            // Marcas de piso.
            Geo.FloorMark("Ruta de montacargas", root, new Vector3(0f, 0f, 14f), new Vector3(32f, 0f, 3f), "PisoCarril", 0.004f);
            Geo.FloorMark("Línea sur de ruta", root, new Vector3(0f, 0f, 12.5f), new Vector3(32f, 0f, 0.12f), "Amarillo");
            Geo.FloorMark("Línea norte de ruta", root, new Vector3(0f, 0f, 15.5f), new Vector3(32f, 0f, 0.12f), "Amarillo");
            for (var i = 0; i < 5; i++)
                Geo.FloorMark("Franja del cruce", root, new Vector3(0f, 0f, 12.9f + i * 0.55f), new Vector3(2.8f, 0f, 0.3f), "Blanco", 0.008f);
            Geo.FloorMark("Pasillo peatonal sur", root, new Vector3(0f, 0f, 9.25f), new Vector3(2.4f, 0f, 6.5f), "PasilloVerde");
            Geo.FloorMark("Pasillo peatonal norte", root, new Vector3(0f, 0f, 16.75f), new Vector3(2.4f, 0f, 2.5f), "PasilloVerde");
            for (var x = -12f; x <= 12f; x += 6f)
            {
                if (Mathf.Abs(x) < 2f) continue;
                Geo.FloorMark("Flecha de ruta", root, new Vector3(x, 0f, 14f), new Vector3(1.4f, 0f, 0.25f), "Amarillo", 0.008f);
            }

            // Barandales del pasillo peatonal (el tramo este tiene una sección faltante).
            Railing(root, -1.5f, 6.3f, 12.3f);
            Railing(root, 1.5f, 6.3f, 8.7f);
            Railing(root, 1.5f, 10.9f, 12.3f);
            Railing(root, -1.5f, 15.7f, 17.8f);
            Railing(root, 1.5f, 15.7f, 17.8f);

            // Semáforos peatonales.
            var southSignal = SignalPost(root, new Vector3(-2.1f, 0f, 12.2f), Vector3.back, out var redS, out var greenS, out var textS);
            var northSignal = SignalPost(root, new Vector3(2.1f, 0f, 15.8f), Vector3.forward, out var redN, out var greenN, out var textN);
            southSignal.name = "Semáforo peatonal sur";
            northSignal.name = "Semáforo peatonal norte";
            Geo.Sign("Letrero montacargas", root, new Vector3(-6f, 3.2f, 6.15f), Vector3.forward,
                "PRECAUCIÓN: TRÁNSITO DE MONTACARGAS\nCruce solo por el paso peatonal con luz verde", 5f, 0.9f, "Amarillo", TextDark, 30);

            // Decoración: tarimas y racks.
            for (var i = 0; i < 3; i++)
            {
                Geo.Box("Tarima", root, new Vector3(-12f + i * 1.6f, 0.08f, 8f), new Vector3(1.2f, 0.16f, 1f), "Madera");
                Geo.Box("Carga", root, new Vector3(-12f + i * 1.6f, 0.6f, 8f), new Vector3(1.1f, 0.9f, 0.9f), "Carton");
                Geo.Box("Tarima", root, new Vector3(9f + i * 1.6f, 0.08f, 17f), new Vector3(1.2f, 0.16f, 1f), "Madera");
                Geo.Box("Carga", root, new Vector3(9f + i * 1.6f, 0.6f, 17f), new Vector3(1.1f, 0.9f, 0.9f), "Carton");
            }

            // Montacargas.
            s_Forklift = BuildForklift(root);
            s_Forklift.greenLamps = new[] { greenS, greenN };
            s_Forklift.redLamps = new[] { redS, redN };
            s_Forklift.signalTexts = new[] { textS, textN };

            sc.forklift = s_Forklift;
            sc.crosswalk = Geo.Zone("Cruce peatonal", root, new Vector3(0f, 0f, 14f), new Vector3(3f, 3f, 3f), ZoneInfo);
            sc.laneWest = Geo.Zone("Ruta montacargas oeste", root, new Vector3(-8.75f, 0f, 14f), new Vector3(14.5f, 3f, 3f), ZoneDanger);
            sc.laneEast = Geo.Zone("Ruta montacargas este", root, new Vector3(8.75f, 0f, 14f), new Vector3(14.5f, 3f, 3f), ZoneDanger);
            sc.northArrival = Geo.Zone("Llegada norte", root, new Vector3(0f, 0f, 16.8f), new Vector3(5f, 3f, 2.4f), ZoneInfo);
            s_Forklift.crosswalk = sc.crosswalk;
            s_Forklift.laneWest = sc.laneWest;
            s_Forklift.laneEast = sc.laneEast;
            return sc;
        }

        static void Railing(Transform root, float x, float z0, float z1)
        {
            var rail = Geo.Group("Barandal", root);
            rail.position = new Vector3(x, 0f, (z0 + z1) * 0.5f);
            var len = z1 - z0;
            for (var z = z0; z <= z1 + 0.01f; z += 1.2f)
                Geo.LocalCylinder("Poste", rail, new Vector3(0f, 0.55f, z - rail.position.z), 0.07f, 1.1f, "Amarillo");
            Geo.LocalBox("Pasamanos", rail, new Vector3(0f, 1.08f, 0f), new Vector3(0.07f, 0.07f, len), "Amarillo");
            Geo.LocalBox("Travesaño", rail, new Vector3(0f, 0.55f, 0f), new Vector3(0.05f, 0.05f, len), "Amarillo");
            var col = rail.gameObject.AddComponent<BoxCollider>();
            col.center = new Vector3(0f, 0.6f, 0f);
            col.size = new Vector3(0.12f, 1.2f, len);
        }

        static Transform SignalPost(Transform root, Vector3 basePos, Vector3 facing, out Renderer red, out Renderer green, out Text text)
        {
            var post = Geo.Group("Semáforo", root);
            post.position = basePos;
            post.rotation = Quaternion.LookRotation(-facing, Vector3.up);
            Geo.LocalCylinder("Poste", post, new Vector3(0f, 1.2f, 0f), 0.1f, 2.4f, "MetalOscuro", true);
            Geo.LocalBox("Cabezal", post, new Vector3(0f, 2.3f, 0f), new Vector3(0.36f, 0.75f, 0.25f), "Negro");
            red = Geo.LocalSphere("Luz roja", post, new Vector3(0f, 2.47f, -0.13f), Vector3.one * 0.22f, "LuzRoja").GetComponent<Renderer>();
            green = Geo.LocalSphere("Luz verde", post, new Vector3(0f, 2.12f, -0.13f), Vector3.one * 0.22f, "LuzApagada").GetComponent<Renderer>();
            text = Geo.WorldText("Indicación", post, new Vector3(0f, 1.55f, -0.08f), Quaternion.identity, "ESPERE", 34, Color.white,
                new Vector2(260f, 110f), 0.004f, false, new Color(0f, 0f, 0f, 0.85f));
            return post;
        }

        static ForkliftController BuildForklift(Transform root)
        {
            var fl = Geo.Group("Montacargas", root);
            fl.position = new Vector3(-13f, 0f, 14f);
            fl.rotation = Quaternion.Euler(0f, 90f, 0f);
            Geo.LocalBox("Chasis", fl, new Vector3(0f, 0.6f, 0f), new Vector3(1.2f, 0.7f, 2f), "Montacargas", true);
            Geo.LocalBox("Contrapeso", fl, new Vector3(0f, 0.75f, -0.95f), new Vector3(1.15f, 0.9f, 0.4f), "MetalOscuro");
            Geo.LocalBox("Asiento", fl, new Vector3(0f, 1.1f, -0.3f), new Vector3(0.5f, 0.3f, 0.5f), "Negro");
            foreach (var px in new[] { -0.5f, 0.5f })
            {
                foreach (var pz in new[] { -0.6f, 0.5f })
                    Geo.LocalCylinder("Poste protector", fl, new Vector3(px, 1.65f, pz), 0.06f, 1.4f, "MetalOscuro");
                var w1 = Geo.LocalCylinder("Rueda", fl, new Vector3(px * 1.15f, 0.28f, 0.65f), 0.56f, 0.22f, "Caucho");
                w1.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
                var w2 = Geo.LocalCylinder("Rueda", fl, new Vector3(px * 1.15f, 0.28f, -0.65f), 0.56f, 0.22f, "Caucho");
                w2.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
                Geo.LocalBox("Mástil", fl, new Vector3(px * 0.7f, 1.2f, 1.1f), new Vector3(0.08f, 2.3f, 0.08f), "MetalOscuro");
                Geo.LocalBox("Horquilla", fl, new Vector3(px * 0.5f, 0.12f, 1.65f), new Vector3(0.12f, 0.05f, 1.1f), "Acero");
            }
            Geo.LocalBox("Techo protector", fl, new Vector3(0f, 2.37f, -0.05f), new Vector3(1.1f, 0.06f, 1.25f), "MetalOscuro");
            Geo.LocalBox("Tarima", fl, new Vector3(0f, 0.2f, 1.65f), new Vector3(1f, 0.12f, 1f), "Madera");
            Geo.LocalBox("Carga", fl, new Vector3(0f, 0.65f, 1.65f), new Vector3(0.9f, 0.8f, 0.9f), "Carton");
            var driver = Geo.Person("Operador de montacargas", fl, fl.position, 90f, "CamisaGris", true, "CascoAmarillo", null, "Piel3");
            driver.transform.localPosition = new Vector3(0f, 0.35f, -0.3f);
            driver.transform.localRotation = Quaternion.identity;
            Object.DestroyImmediate(driver);

            var controller = fl.gameObject.AddComponent<ForkliftController>();
            controller.body = fl;
            controller.palette = Geo.Palette;
            controller.audioCues = s_Audio;
            controller.rigs = s_Rigs;
            controller.beacon = Geo.Lamp("Baliza", fl, Vector3.zero, 0.2f, false, Color.yellow);
            controller.beacon.transform.localPosition = new Vector3(0f, 2.5f, -0.3f);
            controller.nearMissSign = Geo.WorldText("Aviso casi accidente", fl, new Vector3(0f, 3.3f, 0f), Quaternion.identity,
                "¡CASI ACCIDENTE!\nEl montacargas se detuvo", 40, Color.white, new Vector2(620f, 170f), 0.005f, true, new Color(0.75f, 0.1f, 0.08f, 0.95f)).transform.parent.gameObject;
            controller.nearMissSign.SetActive(false);
            controller.nearMissLine = Geo.Line("Trayectoria de riesgo", root, "RayoInvalido", 0.12f);
            return controller;
        }

        // ------------------------------------------------------------------ C. Derrame

        static ScenarioBase BuildAreaC(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioSpill>();
            sc.scenarioId = "C";
            sc.playerStart = Geo.Point("Inicio del visitante C", root, new Vector3(0f, 0f, 18.6f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía C", root, new Vector3(-1.7f, 0f, 20.6f), 0f);
            sc.activationZone = Geo.Zone("Activación C", root, new Vector3(0f, 0f, 19.2f), new Vector3(5f, 3f, 2.4f), ZoneActivation);

            var spill = Geo.Group("Derrame", root);
            spill.position = new Vector3(1f, 0.02f, 22f);
            var blob = Geo.LocalCylinder("Mancha", spill, Vector3.zero, 1f, 0.012f, "Derrame");
            blob.transform.localScale = new Vector3(1.8f, 0.006f, 1.3f);
            var blob2 = Geo.LocalCylinder("Mancha secundaria", spill, new Vector3(0.6f, 0f, -0.5f), 1f, 0.012f, "Derrame");
            blob2.transform.localScale = new Vector3(0.7f, 0.006f, 0.6f);
            sc.spillCenter = spill;
            sc.spillInteractable = Geo.MakeInteractable(spill.gameObject, "Observar el líquido en el piso", spill.position + Vector3.up * 1.2f, new Vector3(2f, 0.08f, 1.6f));

            var drum = Geo.Cylinder("Envase sin etiqueta", root, new Vector3(2.05f, 0f, 21.4f), 0.5f, 0.75f, "Azul");
            drum.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            drum.transform.position = new Vector3(2.05f, 0.25f, 21.2f);

            sc.spillZone = Geo.Zone("Zona del derrame", root, new Vector3(1f, 0f, 22f), new Vector3(2.2f, 3f, 2f), ZoneDanger);
            sc.passZone = Geo.Zone("Salida del pasillo C", root, new Vector3(0f, 0f, 25.3f), new Vector3(5f, 3f, 1.4f), ZoneDanger);

            sc.cones = new[]
            {
                Geo.Cone("Cono 1", root, new Vector3(-0.25f, 0f, 20.85f)),
                Geo.Cone("Cono 2", root, new Vector3(2.15f, 0f, 20.85f)),
                Geo.Cone("Cono 3", root, new Vector3(-0.25f, 0f, 23.15f)),
                Geo.Cone("Cono 4", root, new Vector3(2.15f, 0f, 23.15f))
            };
            var wet = Geo.Group("Letrero piso mojado", root);
            wet.position = new Vector3(1f, 0f, 20.5f);
            var a1 = Geo.LocalBox("Panel", wet, new Vector3(0f, 0.4f, 0f), new Vector3(0.5f, 0.8f, 0.04f), "Amarillo");
            a1.transform.localRotation = Quaternion.Euler(-12f, 0f, 0f);
            Geo.WorldText("Texto", wet, new Vector3(0f, 0.45f, -0.06f), Quaternion.Euler(-12f, 0f, 0f), "(!)\nPISO\nMOJADO", 30, TextDark, new Vector2(120f, 180f), 0.004f);
            sc.wetFloorSign = wet.gameObject;
            sc.unknownLabel = Geo.WorldText("Etiqueta sustancia", root, new Vector3(1f, 1.9f, 22f), Quaternion.identity,
                "(!) SUSTANCIA NO IDENTIFICADA — NO TOCAR", 32, Color.white, new Vector2(760f, 80f), 0.004f, true, new Color(0.7f, 0.1f, 0.1f, 0.9f)).transform.parent.gameObject;
            var prints = new GameObject[4];
            for (var i = 0; i < prints.Length; i++)
                prints[i] = Geo.FloorMark("Huella", root, new Vector3(1f + (i % 2 == 0 ? 0.15f : -0.15f), 0f, 23.3f + i * 0.55f), new Vector3(0.14f, 0f, 0.3f), "Derrame", 0.01f);
            sc.footprints = prints;

            sc.coworker = Geo.Person("Compañero de trabajo", root, new Vector3(1.2f, 0f, 29f), 180f, "CamisaRoja", true, "CascoAmarillo", "Trabajador", "Piel1");
            Geo.LocalBox("Caja cargada", sc.coworker.transform, new Vector3(0f, 1.15f, 0.35f), new Vector3(0.45f, 0.35f, 0.35f), "Carton");
            sc.coworkerStart = Geo.Point("Inicio del trabajador", root, new Vector3(1.2f, 0f, 29f), 180f);
            sc.coworkerStop = Geo.Point("Punto junto al derrame", root, new Vector3(1.05f, 0f, 23.1f), 180f);
            sc.coworkerWarning = Geo.WorldText("Aviso simbólico", sc.coworker.transform, new Vector3(0f, 2.6f, 0f), Quaternion.identity,
                "(!) Representación simbólica:\notra persona pudo resbalar", 30, Color.white, new Vector2(600f, 120f), 0.004f, true, new Color(0.8f, 0.4f, 0.05f, 0.95f)).transform.parent.gameObject;
            sc.coworkerWarning.SetActive(false);
            return sc;
        }

        // ------------------------------------------------------------------ D. Maquinaria protegida

        static ScenarioBase BuildAreaD(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioMachine>();
            sc.scenarioId = "D";
            sc.playerStart = Geo.Point("Inicio del visitante D", root, new Vector3(0f, 0f, 26.8f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía D", root, new Vector3(-0.9f, 0f, 29.4f), 0f);
            sc.activationZone = Geo.Zone("Activación D", root, new Vector3(0f, 0f, 27.5f), new Vector3(6f, 3f, 3f), ZoneActivation);

            Geo.FloorMark("Pasillo peatonal producción", root, new Vector3(0f, 0f, 33f), new Vector3(3f, 0f, 14f), "PasilloVerde");
            Geo.FloorMark("Zona restringida", root, new Vector3(-6f, 0f, 33f), new Vector3(8f, 0f, 7f), "ZonaRestringida");
            for (var i = 0; i < 10; i++)
            {
                var mat = i % 2 == 0 ? "Amarillo" : "Negro";
                Geo.FloorMark("Franja borde", root, new Vector3(-2.15f, 0f, 29.85f + i * 0.7f), new Vector3(0.3f, 0f, 0.7f), mat, 0.009f);
            }
            for (var z = 29.6f; z <= 36.5f; z += 1.4f)
                Geo.Cylinder("Poste de cadena", root, new Vector3(-2f, 0f, z), 0.08f, 0.7f, "Amarillo");
            Geo.Box("Cadena", root, new Vector3(-2f, 0.45f, 33.05f), new Vector3(0.03f, 0.03f, 7f), "Negro", false);
            Geo.Sign("Letrero zona restringida", root, new Vector3(-2.4f, 1.9f, 29.4f), new Vector3(0.6f, 0f, -1f),
                "ZONA RESTRINGIDA\nSolo personal autorizado", 1.8f, 0.7f, "Amarillo", TextDark, 30);

            // Máquina (prensa) con resguardo fijo.
            var machineRoot = Geo.Group("Prensa protegida", root);
            machineRoot.position = new Vector3(-6.5f, 0f, 33f);
            Geo.LocalBox("Base", machineRoot, new Vector3(0f, 0.5f, 0f), new Vector3(2.4f, 1f, 1.8f), "Maquina", true);
            Geo.LocalBox("Columna izquierda", machineRoot, new Vector3(-0.95f, 1.6f, 0f), new Vector3(0.25f, 1.4f, 0.4f), "Maquina", true);
            Geo.LocalBox("Columna derecha", machineRoot, new Vector3(0.95f, 1.6f, 0f), new Vector3(0.25f, 1.4f, 0.4f), "Maquina", true);
            Geo.LocalBox("Travesaño superior", machineRoot, new Vector3(0f, 2.4f, 0f), new Vector3(2.2f, 0.3f, 0.5f), "Maquina", true);
            var head = Geo.LocalBox("Cabezal", machineRoot, new Vector3(0f, 1.9f, 0f), new Vector3(1.5f, 0.35f, 1.0f), "MetalOscuro");
            Geo.LocalBox("Mesa", machineRoot, new Vector3(0f, 1.05f, 0f), new Vector3(1.6f, 0.1f, 1.2f), "Acero");
            Cage(machineRoot, 4f, 4f, 2.2f);
            Geo.Sign("Letrero resguardo", root, new Vector3(-4.45f, 1.6f, 33f), Vector3.right,
                "RESGUARDO FIJO\nNo retirar ni manipular", 1.4f, 0.55f, "Amarillo", TextDark, 26);
            var machine = machineRoot.gameObject.AddComponent<MachineController>();
            machine.pressHead = head.transform;
            machine.topY = 1.9f;
            machine.bottomY = 1.3f;
            machine.palette = Geo.Palette;
            machine.audioCues = s_Audio;
            Geo.Cylinder("Poste de baliza", root, new Vector3(-4.2f, 0f, 35.4f), 0.08f, 2.6f, "MetalOscuro");
            machine.beacon = Geo.Lamp("Baliza de la máquina", root, new Vector3(-4.2f, 2.75f, 35.4f), 0.26f, false, Color.green);
            Geo.Cylinder("Poste de estado", root, new Vector3(-2.35f, 0f, 30.6f), 0.08f, 1.8f, "MetalOscuro");
            machine.statusText = Geo.Sign("Panel de estado", root, new Vector3(-2.35f, 2.25f, 30.6f), Vector3.right,
                "EN OPERACIÓN", 1.8f, 0.75f, "Negro", Color.white, 26);
            sc.machine = machine;

            // Objeto fuera de lugar junto a la máquina.
            var box = Geo.Group("Caja de piezas caída", root);
            box.position = new Vector3(-3.15f, 0.15f, 33.2f);
            box.rotation = Quaternion.Euler(0f, 20f, 0f);
            Geo.LocalBox("Caja", box, Vector3.zero, new Vector3(0.42f, 0.3f, 0.32f), "Carton");
            sc.fallenObject = box;
            sc.objectInteractable = Geo.MakeInteractable(box.gameObject, "Observar objeto junto a la máquina", box.position + Vector3.up * 1.1f, new Vector3(0.6f, 0.45f, 0.5f));

            sc.restrictedZone = Geo.Zone("Zona restringida (detección)", root, new Vector3(-6f, 0f, 33f), new Vector3(8f, 3f, 7f), ZoneDanger);
            sc.passZone = Geo.Zone("Salida de producción", root, new Vector3(0f, 0f, 39.2f), new Vector3(6f, 3f, 1.6f), ZoneDanger);

            sc.technician = Geo.Person("Técnico autorizado", root, new Vector3(-10.6f, 0f, 37.8f), 90f, "Azul", true, "CascoNaranja", "Técnico autorizado", "Piel2");
            var hand = Geo.Group("Mano", sc.technician.transform);
            hand.localPosition = new Vector3(0f, 1.0f, 0.4f);
            sc.technicianHand = hand;
            sc.technicianStart = Geo.Point("Inicio del técnico", root, new Vector3(-10.6f, 0f, 37.8f), 90f);
            sc.technicianVia = Geo.Point("Paso del técnico", root, new Vector3(-3.6f, 0f, 37.3f), 180f);
            sc.technicianPickup = Geo.Point("Punto de retiro", root, new Vector3(-3.6f, 0f, 33.7f), 180f);
            Geo.Sign("Puerta de mantenimiento", root, new Vector3(-11.85f, 2.2f, 37.8f), Vector3.right, "MANTENIMIENTO", 1.6f, 0.4f, "ParedAcento", Color.white, 28);

            // Decoración: banda transportadora protegida y centros de maquinado.
            Geo.Box("Banda transportadora", root, new Vector3(6.5f, 0.45f, 30f), new Vector3(1f, 0.9f, 7f), "MetalOscuro");
            Geo.Box("Guarda de banda", root, new Vector3(5.95f, 1.1f, 30f), new Vector3(0.05f, 0.4f, 7f), "Amarillo");
            for (var i = 0; i < 4; i++)
                Geo.Box("Caja en banda", root, new Vector3(6.5f, 1.05f, 27.5f + i * 1.6f), new Vector3(0.5f, 0.3f, 0.5f), "Carton");
            for (var i = 0; i < 2; i++)
            {
                Geo.Box("Centro de maquinado", root, new Vector3(8.5f, 1.2f, 34f + i * 3f), new Vector3(2.2f, 2.4f, 2f), "Maquina");
                Geo.Box("Ventana", root, new Vector3(7.38f, 1.4f, 34f + i * 3f), new Vector3(0.03f, 0.8f, 1.2f), "Vidrio", false);
            }
            Geo.Person("Operador de maquinado", root, new Vector3(6.6f, 0f, 35.5f), 90f, "CamisaGris", true, "CascoAmarillo", null, "Piel3");
            return sc;
        }

        static void Cage(Transform machineRoot, float sizeX, float sizeZ, float height)
        {
            var cage = Geo.Group("Resguardo fijo", machineRoot);
            var hx = sizeX * 0.5f;
            var hz = sizeZ * 0.5f;
            for (var x = -hx; x <= hx + 0.01f; x += 0.5f)
            {
                Geo.LocalCylinder("Barra", cage, new Vector3(x, height * 0.5f, -hz), 0.04f, height, "Amarillo");
                Geo.LocalCylinder("Barra", cage, new Vector3(x, height * 0.5f, hz), 0.04f, height, "Amarillo");
            }
            for (var z = -hz; z <= hz + 0.01f; z += 0.5f)
            {
                Geo.LocalCylinder("Barra", cage, new Vector3(-hx, height * 0.5f, z), 0.04f, height, "Amarillo");
                Geo.LocalCylinder("Barra", cage, new Vector3(hx, height * 0.5f, z), 0.04f, height, "Amarillo");
            }
            foreach (var y in new[] { 0.1f, height })
            {
                Geo.LocalBox("Marco", cage, new Vector3(0f, y, -hz), new Vector3(sizeX, 0.06f, 0.06f), "Amarillo");
                Geo.LocalBox("Marco", cage, new Vector3(0f, y, hz), new Vector3(sizeX, 0.06f, 0.06f), "Amarillo");
                Geo.LocalBox("Marco", cage, new Vector3(-hx, y, 0f), new Vector3(0.06f, 0.06f, sizeZ), "Amarillo");
                Geo.LocalBox("Marco", cage, new Vector3(hx, y, 0f), new Vector3(0.06f, 0.06f, sizeZ), "Amarillo");
            }
            // Colisionadores invisibles: el resguardo impide el acceso físico a la máquina.
            AddWallCollider(cage, new Vector3(0f, height * 0.5f, -hz), new Vector3(sizeX, height, 0.1f));
            AddWallCollider(cage, new Vector3(0f, height * 0.5f, hz), new Vector3(sizeX, height, 0.1f));
            AddWallCollider(cage, new Vector3(-hx, height * 0.5f, 0f), new Vector3(0.1f, height, sizeZ));
            AddWallCollider(cage, new Vector3(hx, height * 0.5f, 0f), new Vector3(0.1f, height, sizeZ));
        }

        static void AddWallCollider(Transform parent, Vector3 localCenter, Vector3 size)
        {
            var go = new GameObject("Colisión resguardo");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localCenter;
            var c = go.AddComponent<BoxCollider>();
            c.size = size;
        }

        // ------------------------------------------------------------------ E. Ensamble y calidad

        static ScenarioBase BuildAreaE(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioAssembly>();
            sc.scenarioId = "E";
            sc.category = HazardCategory.Quality;
            sc.playerStart = Geo.Point("Inicio del visitante E", root, new Vector3(0f, 0f, 40.6f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía E", root, new Vector3(1f, 0f, 44.2f), 0f);
            sc.activationZone = Geo.Zone("Activación E", root, new Vector3(0f, 0f, 41.5f), new Vector3(6f, 3f, 3f), ZoneActivation);
            Geo.FloorMark("Pasillo peatonal ensamble", root, new Vector3(0f, 0f, 46f), new Vector3(3f, 0f, 12f), "PasilloVerde");

            var lineRoot = Geo.Group("Línea de ensamble", root);
            var line = lineRoot.gameObject.AddComponent<AssemblyLine>();
            line.palette = Geo.Palette;
            line.audioCues = s_Audio;

            Geo.Box("Mesa de ensamble", lineRoot, new Vector3(4.6f, 0.45f, 42.3f), new Vector3(1.6f, 0.9f, 1f), "Acero");
            Geo.Box("Banda de la línea", lineRoot, new Vector3(4.6f, 0.43f, 46.2f), new Vector3(0.7f, 0.86f, 6.4f), "MetalOscuro");
            Geo.Box("Superficie de la banda", lineRoot, new Vector3(4.6f, 0.87f, 46.2f), new Vector3(0.6f, 0.02f, 6.4f), "Negro", false);
            Geo.Box("Mesa de inspección", lineRoot, new Vector3(4.6f, 0.45f, 49.9f), new Vector3(1.4f, 0.9f, 1f), "Acero");

            // Contenedores de piezas parecidas (identificación ambigua).
            var binBlue = Geo.Box("Contenedor C-12", lineRoot, new Vector3(4.25f, 1f, 42.1f), new Vector3(0.45f, 0.2f, 0.35f), "ConectorCorrecto");
            var binOrange = Geo.Box("Contenedor C-21", lineRoot, new Vector3(4.95f, 1f, 42.1f), new Vector3(0.45f, 0.2f, 0.35f), "ConectorIncorrecto");
            Geo.WorldText("Etiqueta C-12", lineRoot, new Vector3(4.25f, 1.3f, 41.85f), Quaternion.Euler(0f, -90f, 0f), "C-12", 40, Color.white, new Vector2(140f, 60f), 0.004f, true, new Color(0f, 0f, 0f, 0.7f));
            Geo.WorldText("Etiqueta C-21", lineRoot, new Vector3(4.95f, 1.3f, 41.85f), Quaternion.Euler(0f, -90f, 0f), "C-21", 40, Color.white, new Vector2(140f, 60f), 0.004f, true, new Color(0f, 0f, 0f, 0.7f));
            binBlue.name = "Contenedor C-12 (azul)";
            binOrange.name = "Contenedor C-21 (naranja)";

            // Operador (sin NpcWalker: su brazo lo anima la línea).
            var worker = Geo.Person("Operador de ensamble", lineRoot, new Vector3(5.9f, 0f, 42.7f), -90f, "Bata", false, null, "Operador nuevo", "Piel3");
            line.workerArm = worker.rightArm;
            Object.DestroyImmediate(worker);
            Geo.Person("Inspectora de calidad", lineRoot, new Vector3(5.9f, 0f, 49.9f), -90f, "Bata", false, null, "Control de calidad", "Piel1");
            Object.DestroyImmediate(lineRoot.Find("Inspectora de calidad").GetComponent<NpcWalker>());

            line.spawnPoint = Geo.Point("Inicio de banda", lineRoot, new Vector3(4.6f, 0.9f, 43.2f), 0f);
            line.qcPoint = Geo.Point("Punto de inspección", lineRoot, new Vector3(4.6f, 0.92f, 49.7f), 0f);
            Geo.Box("Contenedor de retrabajo", lineRoot, new Vector3(3.3f, 0.35f, 49.9f), new Vector3(0.8f, 0.7f, 0.8f), "Rojo");
            Geo.Box("Contenedor de aprobadas", lineRoot, new Vector3(4.6f, 0.35f, 51.2f), new Vector3(0.8f, 0.7f, 0.7f), "Verde");
            Geo.WorldText("Etiqueta retrabajo", lineRoot, new Vector3(3.3f, 1.05f, 49.9f), Quaternion.identity, "RETRABAJO", 34, Color.white, new Vector2(260f, 60f), 0.004f, true, new Color(0.6f, 0.1f, 0.1f, 0.9f));
            Geo.WorldText("Etiqueta aprobadas", lineRoot, new Vector3(4.6f, 1.05f, 51.2f), Quaternion.identity, "APROBADAS", 34, Color.white, new Vector2(260f, 60f), 0.004f, true, new Color(0.1f, 0.45f, 0.2f, 0.9f));
            line.reworkPoint = Geo.Point("Punto de retrabajo", lineRoot, new Vector3(3.3f, 0.72f, 49.9f), 0f);
            line.approvedPoint = Geo.Point("Punto de aprobadas", lineRoot, new Vector3(4.6f, 0.72f, 51.2f), 0f);

            // Tarjetas (reserva de objetos reutilizables).
            const int poolSize = 8;
            line.boards = new Transform[poolSize];
            line.connectors = new Renderer[poolSize];
            var pool = Geo.Group("Tarjetas", lineRoot);
            for (var i = 0; i < poolSize; i++)
            {
                var b = Geo.Group("Tarjeta " + (i + 1), pool);
                Geo.LocalBox("PCB", b, new Vector3(0f, 0.015f, 0f), new Vector3(0.36f, 0.03f, 0.26f), "PCB");
                Geo.LocalBox("Chip", b, new Vector3(-0.07f, 0.04f, 0f), new Vector3(0.1f, 0.02f, 0.1f), "Negro");
                var conn = Geo.LocalBox("Conector J1", b, new Vector3(0.1f, 0.05f, 0f), new Vector3(0.08f, 0.06f, 0.14f), "ConectorCorrecto");
                line.boards[i] = b;
                line.connectors[i] = conn.GetComponent<Renderer>();
                b.gameObject.SetActive(false);
            }

            // Paneles: instrucción (interactivo), estado de la línea, calidad y categoría.
            Geo.Cylinder("Soporte hoja", root, new Vector3(2.8f, 0f, 42.2f), 0.07f, 1.1f, "MetalOscuro");
            var instruction = Geo.Group("Hoja de instrucción", root);
            instruction.position = new Vector3(2.8f, 1.65f, 42.2f);
            instruction.rotation = Quaternion.LookRotation(Vector3.right, Vector3.up);
            Geo.LocalBox("Placa", instruction, new Vector3(0f, 0f, 0.03f), new Vector3(1.6f, 1.05f, 0.04f), "Blanco");
            line.instructionText = Geo.WorldText("Texto", instruction, new Vector3(0f, 0f, -0.005f), Quaternion.identity, "", 22, TextDark,
                new Vector2(1.55f / 0.004f, 1.0f / 0.004f), 0.004f, false, null, FontStyle.Normal);
            line.instructionText.alignment = TextAnchor.MiddleLeft;
            sc.stationInteractable = Geo.MakeInteractable(instruction.gameObject, "Observar la estación y la hoja de instrucción",
                instruction.position + Vector3.up * 0.95f, new Vector3(1.6f, 1.05f, 0.25f));

            Geo.Cylinder("Soporte estado", root, new Vector3(2.8f, 0f, 46.2f), 0.07f, 2.1f, "MetalOscuro");
            line.statusText = Geo.Sign("Estado de la línea", root, new Vector3(2.8f, 2.5f, 46.2f), Vector3.left, "LÍNEA EN ESPERA", 2.2f, 0.5f, "Negro", Color.white, 30);
            line.counterText = Geo.Sign("Contador de piezas", root, new Vector3(2.8f, 2.0f, 46.2f), Vector3.left, "", 2.2f, 0.4f, "Negro", new Color(1f, 0.9f, 0.5f), 24);
            line.lineLamp = Geo.Lamp("Luz de la línea", root, new Vector3(2.8f, 3.0f, 46.2f), 0.24f, false, Color.green);
            Geo.Cylinder("Soporte calidad", root, new Vector3(2.8f, 0f, 49.2f), 0.07f, 1.4f, "MetalOscuro");
            line.qcText = Geo.Sign("Pantalla de control de calidad", root, new Vector3(2.8f, 1.9f, 49.2f), Vector3.left, "", 2.2f, 0.75f, "Negro", Color.white, 24);
            Geo.Sign("Categoría calidad", root, new Vector3(2.8f, 3.3f, 48f), Vector3.left,
                "CALIDAD: problema de calidad del producto\n(no es un riesgo de lesión)", 2.6f, 0.6f, "Azul", Color.white, 26);
            sc.line = line;

            sc.supervisor = Geo.Person("Supervisora de línea", root, new Vector3(-5.5f, 0f, 44.5f), 90f, "CamisaVerde", true, "CascoBlanco", "Supervisora", "Piel2");
            sc.supervisorStart = Geo.Point("Inicio supervisora", root, new Vector3(-5.5f, 0f, 44.5f), 90f);
            sc.supervisorStation = Geo.Point("Supervisora en la estación", root, new Vector3(3.3f, 0f, 43.4f), 90f);
            Geo.Box("Escritorio de supervisión", root, new Vector3(-6.6f, 0.4f, 44.5f), new Vector3(1.2f, 0.8f, 1.6f), "Madera");
            Geo.Box("Monitor", root, new Vector3(-6.6f, 1.05f, 44.5f), new Vector3(0.1f, 0.45f, 0.7f), "Negro");

            // Decoración: otras estaciones.
            for (var i = 0; i < 3; i++)
            {
                Geo.Box("Banco de trabajo", root, new Vector3(-6f, 0.45f, 47.5f + i * 1.4f), new Vector3(2.4f, 0.9f, 0.9f), "Acero");
                Geo.Box("Lámpara de banco", root, new Vector3(-6f, 1.4f, 47.5f + i * 1.4f), new Vector3(1.6f, 0.05f, 0.3f), "LuzBlanca", false);
            }

            sc.passZone = Geo.Zone("Salida de ensamble", root, new Vector3(0f, 0f, 51.1f), new Vector3(6f, 3f, 1.8f), ZoneDanger);
            return sc;
        }

        // ------------------------------------------------------------------ F. Almacén y evacuación

        static ScenarioBase BuildAreaF(Transform root)
        {
            var sc = root.gameObject.AddComponent<ScenarioEvacuation>();
            sc.scenarioId = "F";
            sc.playerStart = Geo.Point("Inicio del visitante F", root, new Vector3(0f, 0f, 52.8f), 0f);
            sc.guideSpot = Geo.Point("Punto del guía F", root, new Vector3(-1.2f, 0f, 55.6f), 0f);
            sc.activationZone = Geo.Zone("Activación F", root, new Vector3(0f, 0f, 53.6f), new Vector3(8f, 3f, 3.2f), ZoneActivation);

            // Racks que forman el pasillo hacia la salida este.
            Rack(root, new Vector3(5.95f, 0f, 57.6f), 7.9f);
            Rack(root, new Vector3(5.95f, 0f, 62.4f), 7.9f);
            Rack(root, new Vector3(-8.6f, 0f, 56f), 4f, true);
            Rack(root, new Vector3(-8.6f, 0f, 62f), 4f, true);

            // Ruta de evacuación marcada.
            Geo.FloorMark("Ruta de evacuación 1", root, new Vector3(0f, 0f, 57.5f), new Vector3(0.35f, 0f, 5f), "Verde", 0.008f);
            Geo.FloorMark("Ruta de evacuación 2", root, new Vector3(5f, 0f, 60f), new Vector3(10f, 0f, 0.35f), "Verde", 0.008f);
            for (var x = 1.5f; x < 10f; x += 2f)
                Geo.FloorMark("Flecha de evacuación", root, new Vector3(x, 0f, 60.45f), new Vector3(0.6f, 0f, 0.15f), "Blanco", 0.01f);
            Geo.Sign("Letrero ruta", root, new Vector3(-0.3f, 3.2f, 52.3f), Vector3.forward, "RUTA DE EVACUACIÓN: hacia la salida este", 3.5f, 0.6f, "SalidaVerde", Color.white, 32);
            Geo.Sign("Letrero salida este", root, new Vector3(9.85f, 3.15f, 60f), Vector3.left, "SALIDA DE EMERGENCIA", 2.6f, 0.55f, "SalidaVerde", Color.white, 32);
            Geo.Sign("Letrero salida norte", root, new Vector3(0f, 3.15f, 65.85f), Vector3.back, "SALIDA", 1.6f, 0.5f, "SalidaVerde", Color.white, 32);

            // Cajas que bloquean la ruta (interactivas en conjunto).
            var boxesRoot = Geo.Group("Cajas obstruyendo la ruta", root);
            boxesRoot.position = new Vector3(6.5f, 0f, 60f);
            var stacksZ = new[] { 58.8f, 60f, 61.2f };
            var boxes = new Transform[6];
            var spots = new Transform[6];
            var spotPositions = new[]
            {
                new Vector3(4.3f, 0.5f, 58.8f), new Vector3(4.3f, 1.5f, 58.8f),
                new Vector3(3.1f, 0.5f, 58.8f), new Vector3(3.1f, 1.5f, 58.8f),
                new Vector3(4.3f, 0.5f, 61.2f), new Vector3(4.3f, 1.5f, 61.2f)
            };
            for (var i = 0; i < 6; i++)
            {
                var z = stacksZ[i / 2];
                var y = i % 2 == 0 ? 0.5f : 1.5f;
                boxes[i] = Geo.Box("Caja " + (i + 1), boxesRoot, new Vector3(6.5f, y, z), new Vector3(1.1f, 1f, 1.1f), "Carton").transform;
                spots[i] = Geo.Point("Lugar despejado " + (i + 1), root, spotPositions[i], 0f);
            }
            sc.boxes = boxes;
            sc.boxClearedSpots = spots;
            sc.boxesInteractable = Geo.MakeInteractable(boxesRoot.gameObject, "Observar las cajas en la ruta de evacuación", new Vector3(6.5f, 2.6f, 60f));
            sc.blockedRouteSign = Geo.WorldText("Aviso ruta obstruida", root, new Vector3(6.5f, 2.9f, 60f), Quaternion.identity,
                "RUTA OBSTRUIDA", 40, Color.white, new Vector2(460f, 90f), 0.005f, true, new Color(0.75f, 0.1f, 0.08f, 0.95f)).transform.parent.gameObject;
            sc.blockedRouteSign.SetActive(false);

            sc.warehouseWorker = Geo.Person("Almacenista", root, new Vector3(-4f, 0f, 58.5f), 90f, "CamisaGris", true, "CascoAmarillo", "Almacén", "Piel1");
            sc.workerStart = Geo.Point("Inicio almacenista", root, new Vector3(-4f, 0f, 58.5f), 90f);
            sc.workerNearBoxes = Geo.Point("Almacenista junto a cajas", root, new Vector3(5.2f, 0f, 60f), 90f);

            // Puertas de emergencia (se abren durante la alarma).
            var east = Geo.Group("Puerta salida este", root);
            east.position = new Vector3(10f, 0f, 59f);
            Geo.LocalBox("Hoja", east, new Vector3(0f, 1.3f, 1f), new Vector3(0.1f, 2.6f, 2f), "Rojo", true);
            Geo.LocalBox("Barra antipánico", east, new Vector3(-0.08f, 1.05f, 1f), new Vector3(0.05f, 0.06f, 1.6f), "Acero");
            sc.eastDoor = east;
            sc.eastDoorOpenYaw = 100f;
            var north = Geo.Group("Puerta salida norte", root);
            north.position = new Vector3(-1f, 0f, 66f);
            Geo.LocalBox("Hoja", north, new Vector3(1f, 1.3f, 0f), new Vector3(2f, 2.6f, 0.1f), "Rojo", true);
            sc.northDoor = north;
            sc.northDoorOpenYaw = -100f;

            // Alarma.
            sc.alarmLamps = new[]
            {
                Geo.Lamp("Alarma 1", root, new Vector3(-9.75f, 3.6f, 56f), 0.3f, true, Color.red),
                Geo.Lamp("Alarma 2", root, new Vector3(9.75f, 3.6f, 64f), 0.3f, true, Color.red),
                Geo.Lamp("Alarma 3", root, new Vector3(0f, 3.6f, 52.25f), 0.3f, true, Color.red)
            };

            // Punto de reunión exterior.
            Geo.FloorMark("Punto de reunión (piso)", root, new Vector3(16f, 0f, 66f), new Vector3(4f, 0f, 4f), "Verde", 0.01f);
            Geo.Cylinder("Poste punto de reunión", root, new Vector3(18.3f, 0f, 66f), 0.1f, 2.2f, "MetalOscuro");
            Geo.Sign("Letrero punto de reunión", root, new Vector3(18.3f, 2.6f, 66f), Vector3.left, "PUNTO DE REUNIÓN", 2.4f, 0.8f, "SalidaVerde", Color.white, 36);
            Geo.FloorMark("Andador exterior", root, new Vector3(13f, -0.015f, 60f), new Vector3(6f, 0f, 2f), "Asfalto", -0.012f);

            sc.blockedLookout = Geo.Point("Mirador ruta bloqueada", root, new Vector3(4.6f, 0f, 60f), 90f);
            sc.shortRoute = new[]
            {
                Geo.Point("Ruta corta 1", root, new Vector3(0f, 0f, 56.5f), 0f),
                Geo.Point("Ruta corta 2", root, new Vector3(0f, 0f, 60f), 0f),
                Geo.Point("Ruta corta 3", root, new Vector3(9.2f, 0f, 60f), 0f),
                Geo.Point("Ruta corta 4", root, new Vector3(11.8f, 0f, 60f), 0f),
                Geo.Point("Ruta corta 5", root, new Vector3(14.2f, 0f, 63f), 0f),
                Geo.Point("Ruta corta 6", root, new Vector3(15.6f, 0f, 65.4f), 0f)
            };
            sc.longRoute = new[]
            {
                Geo.Point("Ruta larga 1", root, new Vector3(2f, 0f, 60f), 0f),
                Geo.Point("Ruta larga 2", root, new Vector3(0f, 0f, 61f), 0f),
                Geo.Point("Ruta larga 3", root, new Vector3(0f, 0f, 65f), 0f),
                Geo.Point("Ruta larga 4", root, new Vector3(0f, 0f, 67.8f), 0f),
                Geo.Point("Ruta larga 5", root, new Vector3(8f, 0f, 69f), 0f),
                Geo.Point("Ruta larga 6", root, new Vector3(15.6f, 0f, 68.2f), 0f),
                Geo.Point("Ruta larga 7", root, new Vector3(15.6f, 0f, 66.6f), 0f)
            };

            sc.alarmStartZone = Geo.Zone("Pasillo hacia salida (inicio de alarma)", root, new Vector3(5.5f, 0f, 60f), new Vector3(7f, 3f, 3.6f), ZoneInfo);
            sc.backZone = Geo.Zone("Regreso a ensamble (durante alarma)", root, new Vector3(0f, 0f, 50.6f), new Vector3(6f, 3f, 2.4f), ZoneDanger);
            sc.assemblyZone = Geo.Zone("Punto de reunión", root, new Vector3(16f, 0f, 66f), new Vector3(5f, 3f, 5f), ZoneInfo);
            return sc;
        }

        static void Rack(Transform root, Vector3 center, float length, bool alongZ = false)
        {
            var rack = Geo.Group("Rack", root);
            rack.position = center;
            if (alongZ)
                rack.rotation = Quaternion.Euler(0f, 90f, 0f);
            var half = length * 0.5f;
            for (var x = -half; x <= half + 0.01f; x += length / 3f)
            {
                Geo.LocalBox("Poste", rack, new Vector3(x, 1.5f, -0.5f), new Vector3(0.08f, 3f, 0.08f), "RackNaranja");
                Geo.LocalBox("Poste", rack, new Vector3(x, 1.5f, 0.5f), new Vector3(0.08f, 3f, 0.08f), "RackNaranja");
            }
            foreach (var y in new[] { 0.15f, 1.15f, 2.15f })
            {
                Geo.LocalBox("Repisa", rack, new Vector3(0f, y, 0f), new Vector3(length, 0.06f, 1.1f), "Acero");
                for (var x = -half + 0.7f; x < half - 0.5f; x += 1.3f)
                    Geo.LocalBox("Caja en rack", rack, new Vector3(x, y + 0.38f, 0f), new Vector3(1f, 0.7f, 0.9f), "Carton");
            }
            var col = rack.gameObject.AddComponent<BoxCollider>();
            col.center = new Vector3(0f, 1.5f, 0f);
            col.size = new Vector3(length, 3f, 1.2f);
        }
    }
}
