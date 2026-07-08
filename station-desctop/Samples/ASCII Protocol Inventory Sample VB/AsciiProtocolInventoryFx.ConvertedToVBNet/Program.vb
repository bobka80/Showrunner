'-----------------------------------------------------------------------
' <copyright file="Program.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Windows.Forms

Imports log4net

''' <summary>
''' Provides the entry point for the application
''' </summary>
Public NotInheritable Class Program
	Private Sub New()
	End Sub
	''' <summary>
	''' The main entry point for the application.
	''' </summary>
	<STAThread> _
	Public Shared Sub Main()
		Dim log As ILog

		log4net.Config.XmlConfigurator.Configure()
		log = LogManager.GetLogger(GetType(Program))
		log.Info("--- Application Start ---")

		Service.StartUp()

		Application.EnableVisualStyles()
		Application.SetCompatibleTextRenderingDefault(False)
		Application.Run(New Views.MainForm())

		Service.ShutDown()

		log.Info("--- Application End ---")

		LogManager.Shutdown()
	End Sub
End Class
